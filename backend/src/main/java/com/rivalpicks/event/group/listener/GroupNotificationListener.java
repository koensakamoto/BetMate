package com.rivalpicks.event.group.listener;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.group.GroupMembership;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;
import com.rivalpicks.entity.messaging.Notification.NotificationPriority;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.event.group.GroupDeletedEvent;
import com.rivalpicks.event.group.GroupInvitationEvent;
import com.rivalpicks.event.group.GroupJoinRequestEvent;
import com.rivalpicks.event.group.GroupMemberJoinedEvent;
import com.rivalpicks.event.group.GroupMemberLeftEvent;
import com.rivalpicks.event.group.GroupOwnershipTransferredEvent;
import com.rivalpicks.event.group.GroupRoleChangedEvent;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import com.rivalpicks.repository.user.UserRepository;
import com.rivalpicks.service.group.GroupService;
import com.rivalpicks.service.messaging.MessageNotificationService;
import com.rivalpicks.service.notification.NotificationService;
import com.rivalpicks.service.notification.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * Event listener for group-related events that creates notifications for users.
 */
@Component
public class GroupNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(GroupNotificationListener.class);

    private final NotificationService notificationService;
    private final MessageNotificationService messageNotificationService;
    private final PushNotificationService pushNotificationService;
    private final GroupMembershipRepository groupMembershipRepository;
    private final GroupService groupService;
    private final UserRepository userRepository;

    @Autowired
    public GroupNotificationListener(
            NotificationService notificationService,
            MessageNotificationService messageNotificationService,
            PushNotificationService pushNotificationService,
            GroupMembershipRepository groupMembershipRepository,
            GroupService groupService,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.messageNotificationService = messageNotificationService;
        this.pushNotificationService = pushNotificationService;
        this.groupMembershipRepository = groupMembershipRepository;
        this.groupService = groupService;
        this.userRepository = userRepository;
    }

    /**
     * Handles GroupJoinRequestEvent by creating notifications for all group admins and officers.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the join request was successfully created.
     *
     * @param event The GroupJoinRequestEvent containing join request information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleGroupJoinRequestEvent(GroupJoinRequestEvent event) {
        try {
            logger.info("Processing GROUP_JOIN_REQUEST event for group: {} by user: {}",
                       event.getGroupName(), event.getRequesterUsername());

            // 1. Get the group entity
            Group group = groupService.getGroupById(event.getGroupId());
            if (group == null) {
                logger.warn("Group {} not found for join request", event.getGroupId());
                return;
            }

            // 2. Get all admins in the group
            List<GroupMembership> adminMemberships = groupMembershipRepository
                .findGroupAdmins(group);

            logger.debug("Found {} admins in group '{}'",
                        adminMemberships.size(), group.getGroupName());

            // 3. Create notification for each admin
            int notificationsCreated = 0;
            for (GroupMembership membership : adminMemberships) {
                User admin = membership.getUser();

                // Skip if the admin is inactive
                if (!membership.getIsActive()) {
                    logger.debug("Skipping notification for inactive admin: {}", admin.getUsername());
                    continue;
                }

                // Check user settings - skip if they have disabled group join request notifications
                if (admin.getSettings() != null &&
                    !admin.getSettings().shouldReceiveNotification(NotificationType.GROUP_JOIN_REQUEST)) {
                    logger.debug("Skipping notification for user {} - group join request notifications disabled",
                               admin.getUsername());
                    continue;
                }

                try {
                    // Create notification title and message
                    String title = "Join Request for " + event.getGroupName();
                    String message = event.getRequesterName() + " (@" + event.getRequesterUsername() +
                                   ") wants to join your group";
                    String actionUrl = "/groups/" + event.getGroupId() + "/requests";

                    // Ensure title and message don't exceed maximum lengths
                    if (title.length() > 100) {
                        title = title.substring(0, 97) + "...";
                    }
                    if (message.length() > 500) {
                        message = message.substring(0, 497) + "...";
                    }

                    // Create the notification in the database
                    Notification notification = notificationService.createNotification(
                        admin,
                        title,
                        message,
                        NotificationType.GROUP_JOIN_REQUEST,
                        NotificationPriority.HIGH,  // High priority for admin actions
                        actionUrl,
                        event.getMembershipId(),
                        "GROUP_MEMBERSHIP"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(admin.getId(), notification);

                    // Send push notification
                    pushNotificationService.sendPushNotification(admin, notification);

                    notificationsCreated++;
                    logger.debug("Created join request notification for admin: {}", admin.getUsername());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for admin {}: {}",
                               admin.getUsername(), e.getMessage());
                }
            }

            logger.info("Successfully created {} GROUP_JOIN_REQUEST notifications for group {}",
                       notificationsCreated, event.getGroupId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break join requests
            logger.error("Failed to process GROUP_JOIN_REQUEST event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }

    /**
     * Handles GroupInvitationEvent by creating a notification for the invited user.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the membership was successfully created.
     *
     * @param event The GroupInvitationEvent containing invitation information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleGroupInvitationEvent(GroupInvitationEvent event) {
        try {
            logger.info("Processing GROUP_INVITE event for group: {} by inviter: {} to user: {}",
                       event.getGroupName(), event.getInviterName(), event.getInvitedUsername());

            // 1. Fetch the invited user to ensure they exist
            User invitedUser = userRepository.findById(event.getInvitedUserId()).orElse(null);
            if (invitedUser == null) {
                logger.warn("Invited user {} not found for group invitation", event.getInvitedUserId());
                return;
            }

            // Check user settings - skip if they have disabled group invite notifications
            if (invitedUser.getSettings() != null &&
                !invitedUser.getSettings().shouldReceiveNotification(NotificationType.GROUP_INVITE)) {
                logger.debug("Skipping notification for user {} - group invite notifications disabled",
                           invitedUser.getUsername());
                return;
            }

            // 2. Create notification title and message
            String title = "Group Invitation: " + event.getGroupName();
            String message = event.getInviterName() + " invited you to join " + event.getGroupName();
            String actionUrl = "/groups/" + event.getGroupId();

            // 3. Ensure title and message don't exceed maximum lengths
            if (title.length() > 100) {
                title = title.substring(0, 97) + "...";
            }
            if (message.length() > 500) {
                message = message.substring(0, 497) + "...";
            }

            // 4. Create the notification in the database
            // Use membershipId as relatedEntityId so frontend can accept/reject the invitation
            Notification notification = notificationService.createNotification(
                invitedUser,
                title,
                message,
                NotificationType.GROUP_INVITE,
                NotificationPriority.NORMAL,
                actionUrl,
                event.getMembershipId(),
                "GROUP_MEMBERSHIP"
            );

            // 5. Send real-time notification via WebSocket
            messageNotificationService.sendNotificationToUser(invitedUser.getId(), notification);

            // 6. Send push notification
            pushNotificationService.sendPushNotification(invitedUser, notification);

            logger.info("Successfully created GROUP_INVITE notification for user: {}", invitedUser.getUsername());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break invitations
            logger.error("Failed to process GROUP_INVITE event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }

    /**
     * Handles GroupMemberJoinedEvent by creating notifications for all existing group members.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the membership was successfully created.
     *
     * @param event The GroupMemberJoinedEvent containing information about the new member
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleGroupMemberJoinedEvent(GroupMemberJoinedEvent event) {
        try {
            logger.info("Processing GROUP_JOINED event for group: {} with new member: {}",
                       event.getGroupName(), event.getNewMemberUsername());

            // 1. Get the group entity
            Group group = groupService.getGroupById(event.getGroupId());
            if (group == null) {
                logger.warn("Group {} not found for member joined event", event.getGroupId());
                return;
            }

            // 2. Get all active members in the group
            List<User> allMembers = groupMembershipRepository.findUsersByGroup(group);
            logger.debug("Found {} members in group '{}'", allMembers.size(), group.getGroupName());

            // 3. Create notification for each existing member (excluding the new member)
            int notificationsCreated = 0;
            for (User member : allMembers) {
                // Skip the new member who just joined
                if (member.getId().equals(event.getNewMemberId())) {
                    logger.debug("Skipping notification for the new member: {}", member.getUsername());
                    continue;
                }

                // Check user settings - skip if they have disabled group member joined notifications
                if (member.getSettings() != null &&
                    !member.getSettings().shouldReceiveNotification(NotificationType.GROUP_JOINED)) {
                    logger.debug("Skipping notification for user {} - group member joined notifications disabled",
                               member.getUsername());
                    continue;
                }

                try {
                    // Create notification title and message
                    String title = "New Member in " + event.getGroupName();
                    String message = event.getNewMemberUsername() + " joined " + event.getGroupName();
                    String actionUrl = "/groups/" + event.getGroupId();

                    // Ensure title and message don't exceed maximum lengths
                    if (title.length() > 100) {
                        title = title.substring(0, 97) + "...";
                    }
                    if (message.length() > 500) {
                        message = message.substring(0, 497) + "...";
                    }

                    // Create the notification in the database
                    Notification notification = notificationService.createNotification(
                        member,
                        title,
                        message,
                        NotificationType.GROUP_JOINED,
                        NotificationPriority.LOW,  // Low priority for informational notifications
                        actionUrl,
                        event.getGroupId(),
                        "GROUP"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(member.getId(), notification);

                    // Send push notification
                    pushNotificationService.sendPushNotification(member, notification);

                    notificationsCreated++;
                    logger.debug("Created member joined notification for user: {}", member.getUsername());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for member {}: {}",
                               member.getUsername(), e.getMessage());
                }
            }

            logger.info("Successfully created {} GROUP_JOINED notifications for group {}",
                       notificationsCreated, event.getGroupId());

            // 4. Notify the new member that they've joined the group
            logger.info("Step 4: Attempting to notify new member with ID: {}", event.getNewMemberId());
            try {
                User newMember = userRepository.findById(event.getNewMemberId()).orElse(null);
                logger.info("Step 4: Found new member: {}", newMember != null ? newMember.getUsername() : "NULL");
                if (newMember != null) {
                    String welcomeTitle = "Welcome to " + event.getGroupName();
                    String welcomeMessage;

                    if (event.wasInvited()) {
                        // User accepted an invitation
                        welcomeMessage = "You've joined " + event.getGroupName();
                    } else {
                        // User's join request was approved (private group) or direct join (public)
                        boolean isPrivateGroup = group.getPrivacy() != Group.Privacy.PUBLIC;
                        welcomeMessage = isPrivateGroup
                            ? "Your request to join " + event.getGroupName() + " was approved"
                            : "You've joined " + event.getGroupName();
                    }
                    String welcomeActionUrl = "/groups/" + event.getGroupId();

                    // Ensure title and message don't exceed maximum lengths
                    if (welcomeTitle.length() > 100) {
                        welcomeTitle = welcomeTitle.substring(0, 97) + "...";
                    }
                    if (welcomeMessage.length() > 500) {
                        welcomeMessage = welcomeMessage.substring(0, 497) + "...";
                    }

                    Notification welcomeNotification = notificationService.createNotification(
                        newMember,
                        welcomeTitle,
                        welcomeMessage,
                        NotificationType.GROUP_JOINED,
                        NotificationPriority.NORMAL,
                        welcomeActionUrl,
                        event.getGroupId(),
                        "GROUP"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(newMember.getId(), welcomeNotification);

                    // Send push notification
                    pushNotificationService.sendPushNotification(newMember, welcomeNotification);

                    logger.info("Created welcome notification for new member: {}", newMember.getUsername());
                }
            } catch (Exception e) {
                logger.error("Failed to create welcome notification for new member {}: {}",
                           event.getNewMemberId(), e.getMessage(), e);
            }

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break joins
            logger.error("Failed to process GROUP_JOINED event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }

    /**
     * Handles GroupMemberLeftEvent by creating notifications for all remaining group members.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the membership was successfully removed.
     *
     * @param event The GroupMemberLeftEvent containing information about the member who left
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleGroupMemberLeftEvent(GroupMemberLeftEvent event) {
        try {
            logger.info("Processing GROUP_LEFT event for group: {} with member: {} (wasKicked: {})",
                       event.getGroupName(), event.getMemberUsername(), event.wasKicked());

            // 1. Get the group entity
            Group group = groupService.getGroupById(event.getGroupId());
            if (group == null) {
                logger.warn("Group {} not found for member left event", event.getGroupId());
                return;
            }

            // 2. Get all active members in the group (remaining members)
            List<User> allMembers = groupMembershipRepository.findUsersByGroup(group);
            logger.debug("Found {} remaining members in group '{}'", allMembers.size(), group.getGroupName());

            // 3. Also notify the person who was removed/left
            User removedUser = userRepository.findById(event.getMemberId()).orElse(null);

            // 4. Create notification for each remaining member (excluding the person who removed them)
            int notificationsCreated = 0;
            for (User member : allMembers) {
                // Skip the person who removed this member
                if (event.getRemovedById() != null && member.getId().equals(event.getRemovedById())) {
                    logger.debug("Skipping notification for user {} who removed the member", member.getUsername());
                    continue;
                }

                // Check user settings - skip if they have disabled group member left notifications
                if (member.getSettings() != null &&
                    !member.getSettings().shouldReceiveNotification(NotificationType.GROUP_LEFT)) {
                    logger.debug("Skipping notification for user {} - group member left notifications disabled",
                               member.getUsername());
                    continue;
                }

                try {
                    // Create notification title and message
                    String title = event.wasKicked()
                        ? "Member Removed from " + event.getGroupName()
                        : "Member Left " + event.getGroupName();

                    String message;
                    if (event.wasKicked()) {
                        // For kicked/removed members, show they were removed
                        message = event.getMemberName() + " (@" + event.getMemberUsername() + ") " +
                                "was removed from " + event.getGroupName();
                        // Add reason if provided (e.g., "Removed by admin")
                        if (event.getReason() != null && !event.getReason().isEmpty()) {
                            message += " - " + event.getReason();
                        }
                    } else {
                        // For voluntary leaving, use simple "left" language
                        message = event.getMemberName() + " (@" + event.getMemberUsername() + ") " +
                                "left " + event.getGroupName();
                    }

                    String actionUrl = "/groups/" + event.getGroupId();

                    // Ensure title and message don't exceed maximum lengths
                    if (title.length() > 100) {
                        title = title.substring(0, 97) + "...";
                    }
                    if (message.length() > 500) {
                        message = message.substring(0, 497) + "...";
                    }

                    // Create the notification in the database
                    Notification notification = notificationService.createNotification(
                        member,
                        title,
                        message,
                        NotificationType.GROUP_LEFT,
                        NotificationPriority.LOW,  // Low priority for informational notifications
                        actionUrl,
                        event.getGroupId(),
                        "GROUP"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(member.getId(), notification);

                    // Send push notification
                    pushNotificationService.sendPushNotification(member, notification);

                    notificationsCreated++;
                    logger.debug("Created member left notification for user: {}", member.getUsername());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for member {}: {}",
                               member.getUsername(), e.getMessage());
                }
            }

            // 5. Notify the person who was removed (if they were kicked, not if they left voluntarily)
            if (event.wasKicked() && removedUser != null) {
                try {
                    String title = "Removed from " + event.getGroupName();
                    String message = "You were removed from " + event.getGroupName();
                    if (event.getReason() != null && !event.getReason().isEmpty()) {
                        message += " - " + event.getReason();
                    }
                    // No actionUrl - removed users can't access the group anymore
                    String actionUrl = null;

                    // Ensure title and message don't exceed maximum lengths
                    if (title.length() > 100) {
                        title = title.substring(0, 97) + "...";
                    }
                    if (message.length() > 500) {
                        message = message.substring(0, 497) + "...";
                    }

                    // Create the notification for the removed user
                    Notification notification = notificationService.createNotification(
                        removedUser,
                        title,
                        message,
                        NotificationType.GROUP_LEFT,
                        NotificationPriority.HIGH,  // High priority since they were removed
                        actionUrl,
                        event.getGroupId(),
                        "GROUP"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(removedUser.getId(), notification);

                    // Send push notification
                    pushNotificationService.sendPushNotification(removedUser, notification);

                    notificationsCreated++;
                    logger.debug("Created removal notification for removed user: {}", removedUser.getUsername());
                } catch (Exception e) {
                    logger.error("Failed to create notification for removed user {}: {}",
                               removedUser.getUsername(), e.getMessage());
                }
            }

            logger.info("Successfully created {} GROUP_LEFT notifications for group {}",
                       notificationsCreated, event.getGroupId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break leave/removal
            logger.error("Failed to process GROUP_LEFT event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }

    /**
     * Handles GroupRoleChangedEvent by creating a notification for the user whose role was changed.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the role was successfully changed.
     *
     * @param event The GroupRoleChangedEvent containing role change information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleGroupRoleChangedEvent(GroupRoleChangedEvent event) {
        try {
            logger.info("Processing GROUP_ROLE_CHANGED event for group: {} user: {} (old: {}, new: {})",
                       event.getGroupName(), event.getTargetUsername(),
                       event.getOldRole(), event.getNewRole());

            // 1. Fetch the target user to ensure they exist
            User targetUser = userRepository.findById(event.getTargetUserId()).orElse(null);
            if (targetUser == null) {
                logger.warn("Target user {} not found for role change notification", event.getTargetUserId());
                return;
            }

            // Check user settings - skip if they have disabled group role changed notifications
            if (targetUser.getSettings() != null &&
                !targetUser.getSettings().shouldReceiveNotification(NotificationType.GROUP_ROLE_CHANGED)) {
                logger.debug("Skipping notification for user {} - group role changed notifications disabled",
                           targetUser.getUsername());
                return;
            }

            // 2. Create notification message using Option 1 style
            String message;
            if (event.wasPromoted()) {
                // Use "promoted" for upward role changes
                message = "You were promoted to " + event.getNewRole() + " in " + event.getGroupName();
            } else {
                // Use "changed" for other role changes
                message = "Your role was changed to " + event.getNewRole() + " in " + event.getGroupName();
            }

            String title = "Role Changed: " + event.getGroupName();
            String actionUrl = "/groups/" + event.getGroupId();

            // 3. Ensure title and message don't exceed maximum lengths
            if (title.length() > 100) {
                title = title.substring(0, 97) + "...";
            }
            if (message.length() > 500) {
                message = message.substring(0, 497) + "...";
            }

            // 4. Create the notification in the database
            Notification notification = notificationService.createNotification(
                targetUser,
                title,
                message,
                NotificationType.GROUP_ROLE_CHANGED,
                NotificationPriority.NORMAL,
                actionUrl,
                event.getGroupId(),
                "GROUP"
            );

            // 5. Send real-time notification via WebSocket
            messageNotificationService.sendNotificationToUser(targetUser.getId(), notification);

            // 6. Send push notification
            pushNotificationService.sendPushNotification(targetUser, notification);

            logger.info("Successfully created GROUP_ROLE_CHANGED notification for user: {}",
                       targetUser.getUsername());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break role changes
            logger.error("Failed to process GROUP_ROLE_CHANGED event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }

    /**
     * Handles GroupDeletedEvent by creating notifications for all group members.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the deletion was successful.
     *
     * @param event The GroupDeletedEvent containing group and member information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleGroupDeletedEvent(GroupDeletedEvent event) {
        try {
            logger.info("Processing GROUP_DELETED event for group: {} deleted by user: {}",
                       event.getGroupName(), event.getDeletedById());

            // Create notification for each member (excluding the person who deleted the group)
            int notificationsCreated = 0;
            for (Long memberId : event.getMemberIds()) {
                // Skip the person who deleted the group
                if (memberId.equals(event.getDeletedById())) {
                    logger.debug("Skipping notification for group deleter: user ID {}", memberId);
                    continue;
                }

                try {
                    // Get the user entity
                    User member = userRepository.findById(memberId).orElse(null);
                    if (member == null) {
                        logger.warn("User {} not found for group deleted notification", memberId);
                        continue;
                    }

                    // Check user settings - skip if they have disabled group deleted notifications
                    if (member.getSettings() != null &&
                        !member.getSettings().shouldReceiveNotification(NotificationType.GROUP_DELETED)) {
                        logger.debug("Skipping notification for user {} - group deleted notifications disabled",
                                   member.getUsername());
                        continue;
                    }

                    // Create notification title and message
                    String title = "Group Deleted: " + event.getGroupName();
                    String message = event.getDeletedByName() + " deleted the group \"" + event.getGroupName() + "\"";

                    // Ensure title and message don't exceed maximum lengths
                    if (title.length() > 100) {
                        title = title.substring(0, 97) + "...";
                    }
                    if (message.length() > 500) {
                        message = message.substring(0, 497) + "...";
                    }

                    // Create the notification in the database
                    Notification notification = notificationService.createNotification(
                        member,
                        title,
                        message,
                        NotificationType.GROUP_DELETED,
                        NotificationPriority.HIGH,  // High priority since the group no longer exists
                        null,  // No actionUrl - group is deleted
                        event.getGroupId(),
                        "GROUP"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(member.getId(), notification);

                    // Send push notification
                    pushNotificationService.sendPushNotification(member, notification);

                    notificationsCreated++;
                    logger.debug("Created GROUP_DELETED notification for user: {}", member.getUsername());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for user {}: {}",
                               memberId, e.getMessage());
                }
            }

            logger.info("Successfully created {} GROUP_DELETED notifications for group {}",
                       notificationsCreated, event.getGroupId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break group deletion
            logger.error("Failed to process GROUP_DELETED event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }

    /**
     * Handles GroupOwnershipTransferredEvent by creating notifications for the new owner,
     * previous owner, and other admins.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the ownership was successfully transferred.
     *
     * @param event The GroupOwnershipTransferredEvent containing ownership transfer information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleGroupOwnershipTransferredEvent(GroupOwnershipTransferredEvent event) {
        try {
            logger.info("Processing GROUP_OWNERSHIP_TRANSFERRED event for group: {} (from {} to {})",
                       event.getGroupName(), event.getPreviousOwnerName(), event.getNewOwnerName());

            // 1. Get the group entity
            Group group = groupService.getGroupById(event.getGroupId());
            if (group == null) {
                logger.warn("Group {} not found for ownership transferred event", event.getGroupId());
                return;
            }

            int notificationsCreated = 0;

            // 2. Notify the NEW owner
            try {
                User newOwner = userRepository.findById(event.getNewOwnerId()).orElse(null);
                if (newOwner != null) {
                    // Check user settings - skip if they have disabled group role changed notifications
                    if (newOwner.getSettings() == null ||
                        newOwner.getSettings().shouldReceiveNotification(NotificationType.GROUP_ROLE_CHANGED)) {
                        String title = "You're now the owner of " + event.getGroupName();
                        String message = event.getPreviousOwnerName() + " transferred ownership to you";
                        String actionUrl = "/groups/" + event.getGroupId();

                        if (title.length() > 100) {
                            title = title.substring(0, 97) + "...";
                        }
                        if (message.length() > 500) {
                            message = message.substring(0, 497) + "...";
                        }

                        Notification notification = notificationService.createNotification(
                            newOwner,
                            title,
                            message,
                            NotificationType.GROUP_ROLE_CHANGED,
                            NotificationPriority.HIGH,
                            actionUrl,
                            event.getGroupId(),
                            "GROUP"
                        );

                        messageNotificationService.sendNotificationToUser(newOwner.getId(), notification);
                        pushNotificationService.sendPushNotification(newOwner, notification);
                        notificationsCreated++;
                        logger.debug("Created ownership notification for new owner: {}", newOwner.getUsername());
                    } else {
                        logger.debug("Skipping notification for user {} - group role changed notifications disabled",
                                   newOwner.getUsername());
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to create notification for new owner {}: {}",
                           event.getNewOwnerId(), e.getMessage());
            }

            // 3. Notify the PREVIOUS owner
            try {
                User previousOwner = userRepository.findById(event.getPreviousOwnerId()).orElse(null);
                if (previousOwner != null) {
                    // Check user settings - skip if they have disabled group role changed notifications
                    if (previousOwner.getSettings() == null ||
                        previousOwner.getSettings().shouldReceiveNotification(NotificationType.GROUP_ROLE_CHANGED)) {
                        String title = "Ownership Transferred";
                        String message = "You transferred ownership of " + event.getGroupName() + " to " + event.getNewOwnerName();
                        String actionUrl = "/groups/" + event.getGroupId();

                        if (title.length() > 100) {
                            title = title.substring(0, 97) + "...";
                        }
                        if (message.length() > 500) {
                            message = message.substring(0, 497) + "...";
                        }

                        Notification notification = notificationService.createNotification(
                            previousOwner,
                            title,
                            message,
                            NotificationType.GROUP_ROLE_CHANGED,
                            NotificationPriority.NORMAL,
                            actionUrl,
                            event.getGroupId(),
                            "GROUP"
                        );

                        messageNotificationService.sendNotificationToUser(previousOwner.getId(), notification);
                        pushNotificationService.sendPushNotification(previousOwner, notification);
                        notificationsCreated++;
                        logger.debug("Created ownership notification for previous owner: {}", previousOwner.getUsername());
                    } else {
                        logger.debug("Skipping notification for user {} - group role changed notifications disabled",
                                   previousOwner.getUsername());
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to create notification for previous owner {}: {}",
                           event.getPreviousOwnerId(), e.getMessage());
            }

            // 4. Notify OTHER ADMINS (exclude new owner and previous owner)
            try {
                List<GroupMembership> adminMemberships = groupMembershipRepository.findGroupAdmins(group);

                for (GroupMembership membership : adminMemberships) {
                    User admin = membership.getUser();

                    // Skip new owner and previous owner (they already got notifications)
                    if (admin.getId().equals(event.getNewOwnerId()) ||
                        admin.getId().equals(event.getPreviousOwnerId())) {
                        continue;
                    }

                    // Skip inactive admins
                    if (!membership.getIsActive()) {
                        continue;
                    }

                    // Check user settings - skip if they have disabled group role changed notifications
                    if (admin.getSettings() != null &&
                        !admin.getSettings().shouldReceiveNotification(NotificationType.GROUP_ROLE_CHANGED)) {
                        logger.debug("Skipping notification for user {} - group role changed notifications disabled",
                                   admin.getUsername());
                        continue;
                    }

                    try {
                        String title = "Group Ownership Changed";
                        String message = event.getNewOwnerName() + " is now the owner of " + event.getGroupName();
                        String actionUrl = "/groups/" + event.getGroupId();

                        if (title.length() > 100) {
                            title = title.substring(0, 97) + "...";
                        }
                        if (message.length() > 500) {
                            message = message.substring(0, 497) + "...";
                        }

                        Notification notification = notificationService.createNotification(
                            admin,
                            title,
                            message,
                            NotificationType.GROUP_ROLE_CHANGED,
                            NotificationPriority.LOW,
                            actionUrl,
                            event.getGroupId(),
                            "GROUP"
                        );

                        messageNotificationService.sendNotificationToUser(admin.getId(), notification);
                        pushNotificationService.sendPushNotification(admin, notification);
                        notificationsCreated++;
                        logger.debug("Created ownership notification for admin: {}", admin.getUsername());

                    } catch (Exception e) {
                        logger.error("Failed to create notification for admin {}: {}",
                                   admin.getUsername(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to notify other admins for group {}: {}",
                           event.getGroupId(), e.getMessage());
            }

            logger.info("Successfully created {} GROUP_OWNERSHIP_TRANSFERRED notifications for group {}",
                       notificationsCreated, event.getGroupId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break ownership transfer
            logger.error("Failed to process GROUP_OWNERSHIP_TRANSFERRED event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }
}

package com.rivalpicks.event.group.listener;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.group.GroupMembership;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;
import com.rivalpicks.entity.messaging.Notification.NotificationPriority;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.event.group.GroupInvitationEvent;
import com.rivalpicks.event.group.GroupJoinRequestEvent;
import com.rivalpicks.event.group.GroupMemberJoinedEvent;
import com.rivalpicks.event.group.GroupMemberLeftEvent;
import com.rivalpicks.event.group.GroupRoleChangedEvent;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import com.rivalpicks.repository.user.UserRepository;
import com.rivalpicks.service.group.GroupService;
import com.rivalpicks.service.messaging.MessageNotificationService;
import com.rivalpicks.service.notification.NotificationService;
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
    private final GroupMembershipRepository groupMembershipRepository;
    private final GroupService groupService;
    private final UserRepository userRepository;

    @Autowired
    public GroupNotificationListener(
            NotificationService notificationService,
            MessageNotificationService messageNotificationService,
            GroupMembershipRepository groupMembershipRepository,
            GroupService groupService,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.messageNotificationService = messageNotificationService;
        this.groupMembershipRepository = groupMembershipRepository;
        this.groupService = groupService;
        this.userRepository = userRepository;
    }

    /**
     * Handles GroupJoinRequestEvent by creating notifications for all group admins and officers.
     * Runs asynchronously to avoid blocking join request processing.
     *
     * @param event The GroupJoinRequestEvent containing join request information
     */
    @EventListener
    @Transactional
    @Async
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

            // 2. Get all admins and officers in the group
            List<GroupMembership> adminMemberships = groupMembershipRepository
                .findGroupAdminsAndModerators(group);

            logger.debug("Found {} admins/officers in group '{}'",
                        adminMemberships.size(), group.getGroupName());

            // 3. Create notification for each admin/officer
            int notificationsCreated = 0;
            for (GroupMembership membership : adminMemberships) {
                User admin = membership.getUser();

                // Skip if the admin is inactive
                if (!membership.getIsActive()) {
                    logger.debug("Skipping notification for inactive admin: {}", admin.getUsername());
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
     * Runs asynchronously to avoid blocking the invitation process.
     *
     * @param event The GroupInvitationEvent containing invitation information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
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
     * Runs asynchronously to avoid blocking the join process.
     *
     * @param event The GroupMemberJoinedEvent containing information about the new member
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
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

                try {
                    // Create notification title and message
                    String title = "New Member in " + event.getGroupName();
                    String actionVerb = event.wasInvited() ? "joined" : "joined";
                    String message = event.getNewMemberName() + " (@" + event.getNewMemberUsername() +
                                   ") " + actionVerb + " " + event.getGroupName();
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

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break joins
            logger.error("Failed to process GROUP_JOINED event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }

    /**
     * Handles GroupMemberLeftEvent by creating notifications for all remaining group members.
     * Uses TransactionalEventListener with AFTER_COMMIT to ensure the membership was successfully removed.
     * Runs asynchronously to avoid blocking the leave/removal process.
     *
     * @param event The GroupMemberLeftEvent containing information about the member who left
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
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
     * Runs asynchronously to avoid blocking the role change process.
     *
     * @param event The GroupRoleChangedEvent containing role change information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
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

            logger.info("Successfully created GROUP_ROLE_CHANGED notification for user: {}",
                       targetUser.getUsername());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break role changes
            logger.error("Failed to process GROUP_ROLE_CHANGED event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }
}

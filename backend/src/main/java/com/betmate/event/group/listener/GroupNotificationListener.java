package com.betmate.event.group.listener;

import com.betmate.entity.group.Group;
import com.betmate.entity.group.GroupMembership;
import com.betmate.entity.messaging.Notification;
import com.betmate.entity.messaging.Notification.NotificationType;
import com.betmate.entity.messaging.Notification.NotificationPriority;
import com.betmate.entity.user.User;
import com.betmate.event.group.GroupInvitationEvent;
import com.betmate.event.group.GroupJoinRequestEvent;
import com.betmate.repository.group.GroupMembershipRepository;
import com.betmate.repository.user.UserRepository;
import com.betmate.service.group.GroupService;
import com.betmate.service.messaging.MessageNotificationService;
import com.betmate.service.notification.NotificationService;
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
                    String title = "👥 Join Request for " + event.getGroupName();
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
}

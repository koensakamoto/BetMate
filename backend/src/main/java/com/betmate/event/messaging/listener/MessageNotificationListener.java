package com.betmate.event.messaging.listener;

import com.betmate.entity.group.Group;
import com.betmate.entity.messaging.Notification;
import com.betmate.entity.messaging.Notification.NotificationPriority;
import com.betmate.entity.messaging.Notification.NotificationType;
import com.betmate.entity.user.User;
import com.betmate.event.messaging.MessageCreatedEvent;
import com.betmate.repository.group.GroupMembershipRepository;
import com.betmate.service.group.GroupService;
import com.betmate.service.messaging.MessageNotificationService;
import com.betmate.service.notification.NotificationService;
import com.betmate.service.notification.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Event listener for message-related events that creates notifications for group members.
 * Handles both in-app notifications (stored in database) and push notifications (via Expo).
 */
@Component
public class MessageNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(MessageNotificationListener.class);

    private final NotificationService notificationService;
    private final MessageNotificationService messageNotificationService;
    private final PushNotificationService pushNotificationService;
    private final GroupMembershipRepository groupMembershipRepository;
    private final GroupService groupService;

    @Autowired
    public MessageNotificationListener(
            NotificationService notificationService,
            MessageNotificationService messageNotificationService,
            PushNotificationService pushNotificationService,
            GroupMembershipRepository groupMembershipRepository,
            GroupService groupService) {
        this.notificationService = notificationService;
        this.messageNotificationService = messageNotificationService;
        this.pushNotificationService = pushNotificationService;
        this.groupMembershipRepository = groupMembershipRepository;
        this.groupService = groupService;
    }

    /**
     * Handles MessageCreatedEvent by creating notifications for all group members (except sender).
     * Creates both in-app notifications and sends push notifications to users with registered tokens.
     * Runs asynchronously to avoid blocking message posting.
     *
     * @param event The MessageCreatedEvent containing message information
     */
    @EventListener
    @Transactional
    @Async
    public void handleMessageCreatedEvent(MessageCreatedEvent event) {
        try {
            logger.info("Processing MESSAGE_CREATED event for group: {} by user: {}",
                       event.getGroupName(), event.getSenderUsername());

            // Skip direct messages for now (handle in future if needed)
            if (event.isDirectMessage()) {
                logger.debug("Skipping notification for direct message");
                return;
            }

            // 1. Get the group entity
            Group group = groupService.getGroupById(event.getGroupId());
            if (group == null) {
                logger.warn("Group {} not found for message notification", event.getGroupId());
                return;
            }

            // 2. Get all active members in the group
            List<User> allMembers = groupMembershipRepository.findUsersByGroup(group);
            logger.debug("Found {} members in group '{}'", allMembers.size(), group.getGroupName());

            // 3. Filter out the sender and collect recipients
            List<User> recipients = new ArrayList<>();
            List<User> pushRecipients = new ArrayList<>();

            for (User member : allMembers) {
                // Skip the sender
                if (member.getId().equals(event.getSenderId())) {
                    continue;
                }

                recipients.add(member);

                // Track users with push tokens for push notifications
                if (member.hasPushToken()) {
                    pushRecipients.add(member);
                }
            }

            if (recipients.isEmpty()) {
                logger.debug("No recipients to notify for message in group {}", event.getGroupId());
                return;
            }

            // 4. Create notification title and message
            String title = event.getGroupName();
            String message = event.getSenderName() + ": " + event.getMessagePreview();
            String actionUrl = "/groups/" + event.getGroupId() + "/chat";

            // Ensure title and message don't exceed maximum lengths
            if (title.length() > 100) {
                title = title.substring(0, 97) + "...";
            }
            if (message.length() > 500) {
                message = message.substring(0, 497) + "...";
            }

            // 5. Create in-app notifications for all recipients
            int notificationsCreated = 0;
            for (User recipient : recipients) {
                try {
                    Notification notification = notificationService.createNotification(
                        recipient,
                        title,
                        message,
                        NotificationType.GROUP_MESSAGE,
                        NotificationPriority.NORMAL,
                        actionUrl,
                        event.getMessageId(),
                        "MESSAGE"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(recipient.getId(), notification);

                    notificationsCreated++;
                    logger.debug("Created message notification for user: {}", recipient.getUsername());

                } catch (Exception e) {
                    logger.error("Failed to create notification for user {}: {}",
                               recipient.getUsername(), e.getMessage());
                }
            }

            logger.info("Successfully created {} GROUP_MESSAGE notifications for group {}",
                       notificationsCreated, event.getGroupId());

            // 6. Send push notifications to users with tokens
            if (!pushRecipients.isEmpty()) {
                try {
                    pushNotificationService.sendMessageNotification(
                        pushRecipients,
                        event.getSenderName(),
                        event.getGroupName(),
                        event.getMessagePreview(),
                        event.getGroupId()
                    );
                    logger.info("Sent push notifications to {} users", pushRecipients.size());
                } catch (Exception e) {
                    logger.error("Failed to send push notifications: {}", e.getMessage());
                }
            }

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break message posting
            logger.error("Failed to process MESSAGE_CREATED event for group {}: {}",
                        event.getGroupId(), e.getMessage(), e);
        }
    }
}

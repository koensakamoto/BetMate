package com.betmate.event.betting.listener;

import com.betmate.entity.group.Group;
import com.betmate.entity.messaging.Notification;
import com.betmate.entity.messaging.Notification.NotificationType;
import com.betmate.entity.messaging.Notification.NotificationPriority;
import com.betmate.entity.user.User;
import com.betmate.event.betting.BetCreatedEvent;
import com.betmate.repository.group.GroupMembershipRepository;
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

import java.util.List;

/**
 * Event listener for bet-related events that creates notifications for users.
 * This is the first domain event listener in the codebase, establishing the pattern
 * for event-driven notifications.
 */
@Component
public class BetNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(BetNotificationListener.class);

    private final NotificationService notificationService;
    private final MessageNotificationService messageNotificationService;
    private final GroupMembershipRepository groupMembershipRepository;
    private final GroupService groupService;

    @Autowired
    public BetNotificationListener(
            NotificationService notificationService,
            MessageNotificationService messageNotificationService,
            GroupMembershipRepository groupMembershipRepository,
            GroupService groupService) {
        this.notificationService = notificationService;
        this.messageNotificationService = messageNotificationService;
        this.groupMembershipRepository = groupMembershipRepository;
        this.groupService = groupService;
    }

    /**
     * Handles BetCreatedEvent by creating notifications for all group members except the creator.
     * Runs asynchronously to avoid blocking bet creation.
     *
     * @param event The BetCreatedEvent containing bet and group information
     */
    @EventListener
    @Transactional
    @Async
    public void handleBetCreatedEvent(BetCreatedEvent event) {
        try {
            logger.info("Processing BET_CREATED event for bet ID: {} in group: {}",
                       event.getBetId(), event.getGroupName());

            // 1. Get the group entity
            Group group = groupService.getGroupById(event.getGroupId());
            if (group == null) {
                logger.warn("Group {} not found for bet {}", event.getGroupId(), event.getBetId());
                return;
            }

            // 2. Get all active users in the group
            List<User> groupMembers = groupMembershipRepository.findUsersByGroup(group);
            logger.debug("Found {} members in group '{}'", groupMembers.size(), group.getGroupName());

            // 3. Create notification for each member (except the creator)
            int notificationsCreated = 0;
            for (User member : groupMembers) {
                // Skip the bet creator - they don't need to be notified about their own bet
                if (member.getId().equals(event.getCreatorId())) {
                    logger.debug("Skipping notification for bet creator: {}", member.getUsername());
                    continue;
                }

                try {
                    // Create notification title and message
                    String title = "🎲 New Bet in " + event.getGroupName();
                    String message = event.getCreatorName() + " created a bet: " + event.getBetTitle();
                    String actionUrl = "/bets/" + event.getBetId();

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
                        NotificationType.BET_CREATED,
                        NotificationPriority.NORMAL,
                        actionUrl,
                        event.getBetId(),
                        "BET"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(member.getId(), notification);

                    notificationsCreated++;
                    logger.debug("Created notification for user: {}", member.getUsername());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for user {}: {}",
                               member.getUsername(), e.getMessage());
                }
            }

            logger.info("Successfully created {} BET_CREATED notifications for bet {}",
                       notificationsCreated, event.getBetId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break bet creation
            logger.error("Failed to process BET_CREATED event for bet {}: {}",
                        event.getBetId(), e.getMessage(), e);
        }
    }
}

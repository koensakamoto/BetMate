package com.betmate.event.betting.listener;

import com.betmate.entity.group.Group;
import com.betmate.entity.messaging.Notification;
import com.betmate.entity.messaging.Notification.NotificationType;
import com.betmate.entity.messaging.Notification.NotificationPriority;
import com.betmate.entity.user.User;
import com.betmate.event.betting.BetCancelledEvent;
import com.betmate.event.betting.BetCreatedEvent;
import com.betmate.repository.group.GroupMembershipRepository;
import com.betmate.service.group.GroupService;
import com.betmate.service.messaging.MessageNotificationService;
import com.betmate.service.notification.NotificationService;
import com.betmate.service.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

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
    private final UserService userService;

    @Autowired
    public BetNotificationListener(
            NotificationService notificationService,
            MessageNotificationService messageNotificationService,
            GroupMembershipRepository groupMembershipRepository,
            GroupService groupService,
            UserService userService) {
        this.notificationService = notificationService;
        this.messageNotificationService = messageNotificationService;
        this.groupMembershipRepository = groupMembershipRepository;
        this.groupService = groupService;
        this.userService = userService;
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

    /**
     * Handles BetCancelledEvent by creating notifications for all participants who were refunded.
     * Runs asynchronously to avoid blocking bet cancellation.
     *
     * @param event The BetCancelledEvent containing bet, refund, and cancellation information
     */
    @EventListener
    @Transactional
    @Async
    public void handleBetCancelledEvent(BetCancelledEvent event) {
        try {
            logger.info("Processing BET_CANCELLED event for bet ID: {} in group: {}",
                       event.getBetId(), event.getGroupName());

            // Get the refunds map (userId -> refundAmount)
            Map<Long, BigDecimal> refunds = event.getRefunds();
            if (refunds == null || refunds.isEmpty()) {
                logger.info("No refunds to process for bet {}", event.getBetId());
                return;
            }

            logger.debug("Found {} participants to notify for bet cancellation", refunds.size());

            // Create notification for each participant who received a refund
            int notificationsCreated = 0;
            for (Map.Entry<Long, BigDecimal> refundEntry : refunds.entrySet()) {
                Long userId = refundEntry.getKey();
                BigDecimal refundAmount = refundEntry.getValue();

                // Skip the user who cancelled the bet - they don't need a notification
                if (userId.equals(event.getCancelledById())) {
                    logger.debug("Skipping notification for bet canceller: user ID {}", userId);
                    continue;
                }

                try {
                    // Get the user entity
                    User participant = userService.getUserById(userId);
                    if (participant == null) {
                        logger.warn("User {} not found for bet cancellation notification", userId);
                        continue;
                    }

                    // Create notification title and message
                    String title = "Bet Cancelled: " + event.getGroupName();
                    String message = event.getCancelledByName() + " cancelled the bet: " + event.getBetTitle() +
                                   ". You've been refunded " + refundAmount + " credits.";
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
                        participant,
                        title,
                        message,
                        NotificationType.BET_CANCELLED,
                        NotificationPriority.HIGH, // High priority due to financial impact
                        actionUrl,
                        event.getBetId(),
                        "BET"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(participant.getId(), notification);

                    notificationsCreated++;
                    logger.debug("Created BET_CANCELLED notification for user: {} (refund: {})",
                               participant.getUsername(), refundAmount);

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for user {}: {}",
                               userId, e.getMessage());
                }
            }

            logger.info("Successfully created {} BET_CANCELLED notifications for bet {}",
                       notificationsCreated, event.getBetId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break bet cancellation
            logger.error("Failed to process BET_CANCELLED event for bet {}: {}",
                        event.getBetId(), e.getMessage(), e);
        }
    }
}

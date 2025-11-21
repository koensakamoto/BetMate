package com.rivalpicks.event.betting.listener;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;
import com.rivalpicks.entity.messaging.Notification.NotificationPriority;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.event.betting.BetCancelledEvent;
import com.rivalpicks.event.betting.BetCreatedEvent;
import com.rivalpicks.event.betting.BetResolutionDeadlineApproachingEvent;
import com.rivalpicks.event.betting.BetDeadlineApproachingEvent;
import com.rivalpicks.event.betting.BetResolvedEvent;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import com.rivalpicks.repository.betting.BetParticipationRepository;
import com.rivalpicks.service.group.GroupService;
import com.rivalpicks.service.messaging.MessageNotificationService;
import com.rivalpicks.service.notification.NotificationService;
import com.rivalpicks.service.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

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
    private final BetParticipationRepository betParticipationRepository;
    private final GroupService groupService;
    private final UserService userService;

    @Autowired
    public BetNotificationListener(
            NotificationService notificationService,
            MessageNotificationService messageNotificationService,
            GroupMembershipRepository groupMembershipRepository,
            BetParticipationRepository betParticipationRepository,
            GroupService groupService,
            UserService userService) {
        this.notificationService = notificationService;
        this.messageNotificationService = messageNotificationService;
        this.groupMembershipRepository = groupMembershipRepository;
        this.betParticipationRepository = betParticipationRepository;
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
                    String title = "New Bet in " + event.getGroupName();
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

            // Get all participants (regardless of stake type)
            // For CREDIT bets, we have refund amounts; for SOCIAL bets, we still need to notify
            List<com.betmate.entity.betting.BetParticipation> allParticipations =
                betParticipationRepository.findByBetId(event.getBetId());

            if (allParticipations == null || allParticipations.isEmpty()) {
                logger.info("No participants to notify for bet {}", event.getBetId());
                return;
            }

            logger.debug("Found {} participants to notify for bet cancellation", allParticipations.size());

            // Get the refunds map (userId -> refundAmount) for CREDIT bets
            Map<Long, BigDecimal> refunds = event.getRefunds();
            if (refunds == null) {
                refunds = new java.util.HashMap<>();
            }

            // Create notification for each participant
            int notificationsCreated = 0;
            for (com.betmate.entity.betting.BetParticipation participation : allParticipations) {
                Long userId = participation.getUser().getId();
                BigDecimal refundAmount = refunds.getOrDefault(userId, BigDecimal.ZERO);

                // Skip the user who cancelled the bet - they don't need a notification
                if (userId.equals(event.getCancelledById())) {
                    logger.debug("Skipping notification for bet canceller: user ID {}", userId);
                    continue;
                }

                try {
                    // Get the user entity
                    User participant = participation.getUser();
                    if (participant == null) {
                        logger.warn("User {} not found for bet cancellation notification", userId);
                        continue;
                    }

                    // Create notification title and message
                    String title = "Bet Cancelled: " + event.getGroupName();
                    String message;

                    // Different message for credit vs social bets
                    if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
                        // Credit bet - mention refund
                        message = event.getCancelledByName() + " cancelled the bet: " + event.getBetTitle() +
                                ". You've been refunded " + refundAmount + " credits.";
                    } else {
                        // Social bet - no refund to mention
                        message = event.getCancelledByName() + " cancelled the bet: " + event.getBetTitle() + ".";
                    }

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

    /**
     * Handles BetResolutionDeadlineApproachingEvent by creating notifications for resolvers.
     * Runs asynchronously to avoid blocking the scheduled task.
     *
     * @param event The BetResolutionDeadlineApproachingEvent containing bet and resolver information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleBetResolutionDeadlineApproachingEvent(BetResolutionDeadlineApproachingEvent event) {
        try {
            logger.info("Processing BET_RESOLUTION_DEADLINE_APPROACHING event for bet ID: {} ({} hours before deadline)",
                       event.getBetId(), event.getHoursUntilDeadline());

            // Determine who should be notified based on resolution method
            java.util.List<Long> userIdsToNotify = new java.util.ArrayList<>();
            String resolutionMethod = event.getResolutionMethod();

            switch (resolutionMethod) {
                case "CREATOR_ONLY":
                    // Only notify the creator
                    userIdsToNotify.add(event.getCreatorId());
                    logger.debug("Notifying creator only for bet {}", event.getBetId());
                    break;

                case "ASSIGNED_RESOLVER":
                    // Notify all assigned resolvers
                    if (event.getAssignedResolverIds() != null && !event.getAssignedResolverIds().isEmpty()) {
                        userIdsToNotify.addAll(event.getAssignedResolverIds());
                        logger.debug("Notifying {} assigned resolvers for bet {}",
                                   userIdsToNotify.size(), event.getBetId());
                    } else {
                        logger.warn("No assigned resolvers found for bet {}, falling back to creator", event.getBetId());
                        userIdsToNotify.add(event.getCreatorId());
                    }
                    break;

                case "CONSENSUS_VOTING":
                    // Notify the creator (voters should already be aware)
                    userIdsToNotify.add(event.getCreatorId());
                    logger.debug("Notifying creator for consensus voting bet {}", event.getBetId());
                    break;

                default:
                    logger.warn("Unknown resolution method {} for bet {}, notifying creator",
                               resolutionMethod, event.getBetId());
                    userIdsToNotify.add(event.getCreatorId());
            }

            // Create notifications for each resolver
            int notificationsCreated = 0;
            NotificationPriority priority = event.getHoursUntilDeadline() == 1
                ? NotificationPriority.HIGH
                : NotificationPriority.NORMAL;

            for (Long userId : userIdsToNotify) {
                try {
                    // Get the user entity
                    User resolver = userService.getUserById(userId);
                    if (resolver == null) {
                        logger.warn("User {} not found for resolution reminder", userId);
                        continue;
                    }

                    // Create notification title and message
                    String title = event.getHoursUntilDeadline() == 1
                        ? "Urgent: Bet Resolution Needed in 1 Hour"
                        : "Bet Resolution Reminder: " + event.getBetTitle();

                    String message = event.getHoursUntilDeadline() == 1
                        ? "The bet '" + event.getBetTitle() + "' needs to be resolved within 1 hour. Please resolve it as soon as possible."
                        : "The bet '" + event.getBetTitle() + "' needs to be resolved in 24 hours. Don't forget to resolve it before the deadline.";

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
                        resolver,
                        title,
                        message,
                        NotificationType.BET_RESOLUTION_REMINDER,
                        priority,
                        actionUrl,
                        event.getBetId(),
                        "BET"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(resolver.getId(), notification);

                    notificationsCreated++;
                    logger.debug("Created BET_RESOLUTION_REMINDER notification for user: {} ({} hours before)",
                               resolver.getUsername(), event.getHoursUntilDeadline());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for user {}: {}",
                               userId, e.getMessage());
                }
            }

            logger.info("Successfully created {} BET_RESOLUTION_REMINDER notifications for bet {} ({} hours)",
                       notificationsCreated, event.getBetId(), event.getHoursUntilDeadline());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break scheduled tasks
            logger.error("Failed to process BET_RESOLUTION_DEADLINE_APPROACHING event for bet {}: {}",
                        event.getBetId(), e.getMessage(), e);
        }
    }

    /**
     * Handles BetDeadlineApproachingEvent by creating notifications for group members who haven't placed bets yet.
     * Runs asynchronously to avoid blocking the scheduled task.
     *
     * @param event The BetDeadlineApproachingEvent containing bet and deadline information
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleBetDeadlineApproachingEvent(BetDeadlineApproachingEvent event) {
        try {
            logger.info("Processing BET_DEADLINE_APPROACHING event for bet ID: {} ({} hours before deadline)",
                       event.getBetId(), event.getHoursRemaining());

            // 1. Get the group entity
            Group group = groupService.getGroupById(event.getGroupId());
            if (group == null) {
                logger.warn("Group {} not found for bet {}", event.getGroupId(), event.getBetId());
                return;
            }

            // 2. Get all active users in the group
            List<User> groupMembers = groupMembershipRepository.findUsersByGroup(group);
            logger.debug("Found {} members in group '{}'", groupMembers.size(), group.getGroupName());

            // 3. Get all users who have already placed bets (to exclude them)
            List<Long> participantIds = betParticipationRepository.findByBetId(event.getBetId()).stream()
                    .map(participation -> participation.getUser().getId())
                    .collect(java.util.stream.Collectors.toList());
            logger.debug("Found {} users who already placed bets on bet {}", participantIds.size(), event.getBetId());

            // 4. Create notification for each member who hasn't placed a bet yet
            int notificationsCreated = 0;
            NotificationPriority priority = event.isUrgent()
                ? NotificationPriority.HIGH
                : NotificationPriority.NORMAL;

            for (User member : groupMembers) {
                // Skip users who already placed a bet
                if (participantIds.contains(member.getId())) {
                    logger.debug("Skipping notification for user {} - already placed bet", member.getUsername());
                    continue;
                }

                try {
                    // Create notification title and message
                    String title = event.isUrgent()
                        ? "Last Call: Bet Closing in 1 Hour"
                        : "Bet Closing Soon in " + event.getGroupName();

                    String message = event.isUrgent()
                        ? "The bet '" + event.getBetTitle() + "' closes in 1 hour. Place your bet before it's too late!"
                        : "The bet '" + event.getBetTitle() + "' closes in 24 hours. Don't miss your chance to participate!";

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
                        NotificationType.BET_DEADLINE,
                        priority,
                        actionUrl,
                        event.getBetId(),
                        "BET"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(member.getId(), notification);

                    notificationsCreated++;
                    logger.debug("Created BET_DEADLINE notification for user: {} ({} hours before)",
                               member.getUsername(), event.getHoursRemaining());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for user {}: {}",
                               member.getUsername(), e.getMessage());
                }
            }

            logger.info("Successfully created {} BET_DEADLINE notifications for bet {} ({} hours)",
                       notificationsCreated, event.getBetId(), event.getHoursRemaining());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break scheduled tasks
            logger.error("Failed to process BET_DEADLINE_APPROACHING event for bet {}: {}",
                        event.getBetId(), e.getMessage(), e);
        }
    }

    /**
     * Handles BetResolvedEvent by creating notifications for all bet participants.
     * Winners receive congratulatory messages with HIGH priority, losers receive informational
     * messages with NORMAL priority.
     * Runs asynchronously to avoid blocking bet resolution.
     *
     * @param event The BetResolvedEvent containing bet resolution information and payouts
     */
    @EventListener
    @Transactional
    @Async
    public void handleBetResolvedEvent(BetResolvedEvent event) {
        try {
            logger.info("Processing BET_RESOLVED event for bet ID: {} in group: {}",
                       event.getBetId(), event.getGroupName());

            // Get all participant IDs (winners + losers)
            List<Long> allParticipantIds = new java.util.ArrayList<>();
            if (event.getWinnerIds() != null) {
                allParticipantIds.addAll(event.getWinnerIds());
            }
            if (event.getLoserIds() != null) {
                allParticipantIds.addAll(event.getLoserIds());
            }

            if (allParticipantIds.isEmpty()) {
                logger.info("No participants to notify for bet {}", event.getBetId());
                return;
            }

            logger.debug("Found {} participants to notify for bet resolution", allParticipantIds.size());

            // Create notification for each participant
            int notificationsCreated = 0;
            for (Long userId : allParticipantIds) {
                try {
                    // Skip the resolver - they don't need to be notified about their own resolution
                    if (event.getResolvedById() != null && userId.equals(event.getResolvedById())) {
                        logger.debug("Skipping notification for resolver: user ID {}", userId);
                        continue;
                    }

                    // Get the user entity
                    User participant = userService.getUserById(userId);
                    if (participant == null) {
                        logger.warn("User {} not found for bet resolution notification", userId);
                        continue;
                    }

                    // Check user settings - skip if they have disabled bet result notifications
                    if (participant.getSettings() != null &&
                        participant.getSettings().getBetResultNotifications() != null &&
                        !participant.getSettings().getBetResultNotifications()) {
                        logger.debug("Skipping notification for user {} - bet result notifications disabled",
                                   participant.getUsername());
                        continue;
                    }

                    // Determine if this user won or lost
                    boolean isWinner = event.isWinner(userId);

                    // Create personalized notification title and message
                    String title;
                    String message;
                    NotificationPriority priority;

                    if (isWinner) {
                        // Winner notification - congratulatory message with HIGH priority
                        title = "You Won: " + event.getBetTitle();
                        message = "Congratulations! You won the bet '" + event.getBetTitle() +
                                "' in " + event.getGroupName() + ".";
                        priority = NotificationPriority.HIGH;
                    } else {
                        // Loser notification - informational message with NORMAL priority
                        title = "Bet Resolved: " + event.getBetTitle();
                        message = "The bet '" + event.getBetTitle() + "' has been resolved in " +
                                event.getGroupName() + ".";
                        priority = NotificationPriority.NORMAL;
                    }

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
                        NotificationType.BET_RESULT,
                        priority,
                        actionUrl,
                        event.getBetId(),
                        "BET"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(participant.getId(), notification);

                    notificationsCreated++;
                    logger.debug("Created BET_RESULT notification for user: {} (winner: {})",
                               participant.getUsername(), isWinner);

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for user {}: {}",
                               userId, e.getMessage());
                }
            }

            logger.info("Successfully created {} BET_RESULT notifications for bet {}",
                       notificationsCreated, event.getBetId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break bet resolution
            logger.error("Failed to process BET_RESOLVED event for bet {}: {}",
                        event.getBetId(), e.getMessage(), e);
        }
    }
}

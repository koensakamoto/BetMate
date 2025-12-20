package com.rivalpicks.event.betting.listener;

import com.rivalpicks.entity.betting.BetParticipation;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;
import com.rivalpicks.entity.messaging.Notification.NotificationPriority;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.event.betting.BetFulfillmentSubmittedEvent;
import com.rivalpicks.repository.betting.BetParticipationRepository;
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

import java.util.List;

/**
 * Event listener for bet fulfillment events that creates notifications for users.
 * Notifies all bet participants (except the submitter) when someone submits fulfillment proof.
 */
@Component
public class BetFulfillmentNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(BetFulfillmentNotificationListener.class);

    private final NotificationService notificationService;
    private final MessageNotificationService messageNotificationService;
    private final PushNotificationService pushNotificationService;
    private final BetParticipationRepository betParticipationRepository;

    @Autowired
    public BetFulfillmentNotificationListener(
            NotificationService notificationService,
            MessageNotificationService messageNotificationService,
            PushNotificationService pushNotificationService,
            BetParticipationRepository betParticipationRepository) {
        this.notificationService = notificationService;
        this.messageNotificationService = messageNotificationService;
        this.pushNotificationService = pushNotificationService;
        this.betParticipationRepository = betParticipationRepository;
    }

    /**
     * Handles BetFulfillmentSubmittedEvent by creating notifications for all bet participants
     * except the user who submitted the fulfillment.
     * Runs asynchronously to avoid blocking the fulfillment submission.
     *
     * @param event The BetFulfillmentSubmittedEvent containing bet and submitter information
     */
    @EventListener
    @Transactional
    @Async
    public void handleBetFulfillmentSubmittedEvent(BetFulfillmentSubmittedEvent event) {
        try {
            logger.info("Processing BET_FULFILLMENT_SUBMITTED event for bet ID: {} by user: {}",
                       event.getBetId(), event.getSubmitterUsername());

            // Get all participants of the bet
            List<BetParticipation> participations = betParticipationRepository.findByBetId(event.getBetId());

            if (participations == null || participations.isEmpty()) {
                logger.info("No participants to notify for bet {}", event.getBetId());
                return;
            }

            logger.debug("Found {} participants for bet {}", participations.size(), event.getBetId());

            // Create notification for each participant except the submitter
            int notificationsCreated = 0;
            for (BetParticipation participation : participations) {
                User participant = participation.getUser();

                // Skip the user who submitted the fulfillment
                if (participant.getId().equals(event.getSubmitterId())) {
                    logger.debug("Skipping notification for submitter: {}", participant.getUsername());
                    continue;
                }

                // Check user settings - skip if they have disabled bet fulfillment notifications
                if (participant.getSettings() != null &&
                    !participant.getSettings().shouldReceiveNotification(NotificationType.BET_FULFILLMENT_SUBMITTED)) {
                    logger.debug("Skipping notification for user {} - bet fulfillment notifications disabled",
                               participant.getUsername());
                    continue;
                }

                try {
                    // Create notification title and message
                    String title = "Fulfillment Submitted";
                    String message = event.getSubmitterUsername() + " has submitted fulfillment proof for: " +
                            event.getBetTitle();
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
                        NotificationType.BET_FULFILLMENT_SUBMITTED,
                        NotificationPriority.HIGH,
                        actionUrl,
                        event.getBetId(),
                        "BET"
                    );

                    // Send real-time notification via WebSocket
                    messageNotificationService.sendNotificationToUser(participant.getId(), notification);

                    // Send push notification
                    pushNotificationService.sendPushNotification(participant, notification);

                    notificationsCreated++;
                    logger.debug("Created BET_FULFILLMENT_SUBMITTED notification for user: {}",
                               participant.getUsername());

                } catch (Exception e) {
                    // Log error for individual notification but continue processing others
                    logger.error("Failed to create notification for user {}: {}",
                               participant.getUsername(), e.getMessage());
                }
            }

            logger.info("Successfully created {} BET_FULFILLMENT_SUBMITTED notifications for bet {}",
                       notificationsCreated, event.getBetId());

        } catch (Exception e) {
            // Log error but don't throw - we don't want notification failures to break fulfillment submission
            logger.error("Failed to process BET_FULFILLMENT_SUBMITTED event for bet {}: {}",
                        event.getBetId(), e.getMessage(), e);
        }
    }
}

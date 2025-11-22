package com.rivalpicks.service.notification;

import com.google.firebase.messaging.*;
import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.messaging.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for sending push notifications via Firebase Cloud Messaging (FCM).
 */
@Service
public class PushNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);
    private static final int MAX_BATCH_SIZE = 500; // FCM allows up to 500 per batch

    private final FirebaseMessaging firebaseMessaging;
    private final NotificationRepository notificationRepository;

    @Autowired
    public PushNotificationService(FirebaseMessaging firebaseMessaging, NotificationRepository notificationRepository) {
        this.firebaseMessaging = firebaseMessaging;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Sends a push notification to a single user.
     *
     * @param user the user to send to
     * @param notification the notification to send
     */
    @Async
    public void sendPushNotification(User user, Notification notification) {
        if (!user.hasPushToken()) {
            logger.debug("User {} has no push token, skipping push notification", user.getId());
            return;
        }

        try {
            Message message = buildMessage(user.getExpoPushToken(), notification);
            String messageId = firebaseMessaging.send(message);
            markNotificationAsPushSent(notification);
            logger.info("Push notification sent to user {}, messageId: {}", user.getId(), messageId);
        } catch (FirebaseMessagingException e) {
            handleFirebaseException(user.getId(), user.getExpoPushToken(), e);
        } catch (Exception e) {
            logger.error("Failed to send push notification to user {}: {}", user.getId(), e.getMessage());
        }
    }

    /**
     * Sends push notifications to multiple users.
     *
     * @param users the users to send to
     * @param title the notification title
     * @param body the notification body
     * @param data additional data to include
     */
    @Async
    public void sendPushNotifications(List<User> users, String title, String body, Map<String, Object> data) {
        List<Message> messages = new ArrayList<>();

        // Convert data values to strings (FCM requires string values)
        Map<String, String> stringData = data.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> String.valueOf(e.getValue())
                ));

        for (User user : users) {
            if (user.hasPushToken()) {
                Message message = Message.builder()
                        .setToken(user.getExpoPushToken())
                        .setNotification(com.google.firebase.messaging.Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putAllData(stringData)
                        .setAndroidConfig(AndroidConfig.builder()
                                .setPriority(AndroidConfig.Priority.HIGH)
                                .setNotification(AndroidNotification.builder()
                                        .setChannelId("default")
                                        .setSound("default")
                                        .build())
                                .build())
                        .setApnsConfig(ApnsConfig.builder()
                                .setAps(Aps.builder()
                                        .setSound("default")
                                        .build())
                                .build())
                        .build();
                messages.add(message);
            }
        }

        if (messages.isEmpty()) {
            logger.debug("No users with push tokens to send notifications to");
            return;
        }

        // Send in batches
        for (int i = 0; i < messages.size(); i += MAX_BATCH_SIZE) {
            List<Message> batch = messages.subList(i, Math.min(i + MAX_BATCH_SIZE, messages.size()));
            try {
                BatchResponse response = firebaseMessaging.sendEach(batch);
                logger.info("Sent batch of {} push notifications, {} successful, {} failed",
                        batch.size(), response.getSuccessCount(), response.getFailureCount());

                // Log failures
                if (response.getFailureCount() > 0) {
                    List<SendResponse> responses = response.getResponses();
                    for (int j = 0; j < responses.size(); j++) {
                        if (!responses.get(j).isSuccessful()) {
                            logger.warn("Push notification failed: {}",
                                    responses.get(j).getException().getMessage());
                        }
                    }
                }
            } catch (FirebaseMessagingException e) {
                logger.error("Failed to send push notification batch: {}", e.getMessage());
            }
        }
    }

    /**
     * Sends a message notification to group members.
     *
     * @param recipients list of users to notify (should exclude sender)
     * @param senderName the name of the message sender
     * @param groupName the name of the group
     * @param messagePreview preview of the message content
     * @param groupId the group ID for navigation
     */
    @Async
    public void sendMessageNotification(
            List<User> recipients,
            String senderName,
            String groupName,
            String messagePreview,
            Long groupId) {

        String title = groupName;
        String body = senderName + ": " + messagePreview;
        Map<String, Object> data = Map.of(
            "type", "GROUP_MESSAGE",
            "groupId", groupId,
            "screen", "group-chat"
        );

        sendPushNotifications(recipients, title, body, data);
    }

    /**
     * Builds an FCM message from a notification entity.
     */
    private Message buildMessage(String fcmToken, Notification notification) {
        Map<String, String> data = Map.of(
                "notificationId", String.valueOf(notification.getId()),
                "type", notification.getNotificationType().name(),
                "relatedEntityId", notification.getRelatedEntityId() != null ? String.valueOf(notification.getRelatedEntityId()) : "",
                "relatedEntityType", notification.getRelatedEntityType() != null ? notification.getRelatedEntityType() : "",
                "actionUrl", notification.getActionUrl() != null ? notification.getActionUrl() : ""
        );

        return Message.builder()
                .setToken(fcmToken)
                .setNotification(com.google.firebase.messaging.Notification.builder()
                        .setTitle(notification.getTitle())
                        .setBody(notification.getMessage())
                        .build())
                .putAllData(data)
                .setAndroidConfig(AndroidConfig.builder()
                        .setPriority(notification.isHighPriority() ? AndroidConfig.Priority.HIGH : AndroidConfig.Priority.NORMAL)
                        .setNotification(AndroidNotification.builder()
                                .setChannelId("default")
                                .setSound("default")
                                .build())
                        .build())
                .setApnsConfig(ApnsConfig.builder()
                        .setAps(Aps.builder()
                                .setSound("default")
                                .build())
                        .build())
                .build();
    }

    /**
     * Handles Firebase messaging exceptions.
     */
    private void handleFirebaseException(Long userId, String token, FirebaseMessagingException e) {
        MessagingErrorCode errorCode = e.getMessagingErrorCode();
        if (errorCode == MessagingErrorCode.UNREGISTERED || errorCode == MessagingErrorCode.INVALID_ARGUMENT) {
            // Token is invalid or user uninstalled app - should clear token from user
            logger.warn("Invalid FCM token for user {}, token should be cleared: {}", userId, e.getMessage());
        } else {
            logger.error("FCM error for user {}: {} - {}", userId, errorCode, e.getMessage());
        }
    }

    /**
     * Marks a notification as having been sent via push.
     */
    @Transactional
    public void markNotificationAsPushSent(Notification notification) {
        notification.markPushSent();
        notificationRepository.save(notification);
    }
}

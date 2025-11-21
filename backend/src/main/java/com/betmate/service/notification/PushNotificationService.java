package com.betmate.service.notification;

import com.betmate.entity.messaging.Notification;
import com.betmate.entity.user.User;
import com.betmate.repository.messaging.NotificationRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service for sending push notifications via Expo Push Notification Service.
 *
 * Expo Push API: https://docs.expo.dev/push-notifications/sending-notifications/
 */
@Service
public class PushNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private static final int MAX_BATCH_SIZE = 100;

    private final RestTemplate restTemplate;
    private final NotificationRepository notificationRepository;

    @Autowired
    public PushNotificationService(NotificationRepository notificationRepository) {
        this.restTemplate = new RestTemplate();
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
            ExpoPushMessage message = createExpoPushMessage(user.getExpoPushToken(), notification);
            sendToExpo(List.of(message));
            markNotificationAsPushSent(notification);
            logger.info("Push notification sent to user {}", user.getId());
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
        List<ExpoPushMessage> messages = new ArrayList<>();

        for (User user : users) {
            if (user.hasPushToken()) {
                ExpoPushMessage message = new ExpoPushMessage();
                message.to = user.getExpoPushToken();
                message.title = title;
                message.body = body;
                message.data = data;
                message.sound = "default";
                message.priority = "high";
                messages.add(message);
            }
        }

        if (messages.isEmpty()) {
            logger.debug("No users with push tokens to send notifications to");
            return;
        }

        // Send in batches
        for (int i = 0; i < messages.size(); i += MAX_BATCH_SIZE) {
            List<ExpoPushMessage> batch = messages.subList(i, Math.min(i + MAX_BATCH_SIZE, messages.size()));
            try {
                sendToExpo(batch);
                logger.info("Sent batch of {} push notifications", batch.size());
            } catch (Exception e) {
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
     * Creates an Expo push message from a notification entity.
     */
    private ExpoPushMessage createExpoPushMessage(String pushToken, Notification notification) {
        ExpoPushMessage message = new ExpoPushMessage();
        message.to = pushToken;
        message.title = notification.getTitle();
        message.body = notification.getMessage();
        message.sound = "default";
        message.priority = notification.isHighPriority() ? "high" : "default";
        message.data = Map.of(
            "notificationId", notification.getId(),
            "type", notification.getNotificationType().name(),
            "relatedEntityId", notification.getRelatedEntityId() != null ? notification.getRelatedEntityId() : "",
            "relatedEntityType", notification.getRelatedEntityType() != null ? notification.getRelatedEntityType() : "",
            "actionUrl", notification.getActionUrl() != null ? notification.getActionUrl() : ""
        );
        return message;
    }

    /**
     * Sends messages to Expo Push API.
     */
    private void sendToExpo(List<ExpoPushMessage> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        headers.set("Accept-Encoding", "gzip, deflate");

        HttpEntity<List<ExpoPushMessage>> request = new HttpEntity<>(messages, headers);

        try {
            ExpoPushResponse response = restTemplate.postForObject(
                EXPO_PUSH_URL,
                request,
                ExpoPushResponse.class
            );

            if (response != null && response.data != null) {
                for (int i = 0; i < response.data.size(); i++) {
                    ExpoPushTicket ticket = response.data.get(i);
                    if ("error".equals(ticket.status)) {
                        logger.warn("Push notification failed for token {}: {} - {}",
                            i < messages.size() ? messages.get(i).to : "unknown",
                            ticket.message,
                            ticket.details != null ? ticket.details.error : "no details");
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error calling Expo Push API: {}", e.getMessage());
            throw e;
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

    // ==========================================
    // Expo Push API DTOs
    // ==========================================

    public static class ExpoPushMessage {
        public String to;
        public String title;
        public String body;
        public String sound;
        public String priority;
        public Map<String, Object> data;
        @JsonProperty("channelId")
        public String channelId = "default";
    }

    public static class ExpoPushResponse {
        public List<ExpoPushTicket> data;
    }

    public static class ExpoPushTicket {
        public String status;
        public String id;
        public String message;
        public ExpoPushTicketDetails details;
    }

    public static class ExpoPushTicketDetails {
        public String error;
    }
}

package com.betmate.service.messaging;

import com.betmate.dto.messaging.response.MessageResponseDto;
import com.betmate.entity.group.Group;
import com.betmate.entity.messaging.Message;
import com.betmate.entity.messaging.Notification;
import com.betmate.entity.user.User;
import com.betmate.repository.user.UserRepository;
import com.betmate.service.group.GroupMembershipService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for sending real-time message notifications via WebSocket.
 * Handles broadcasting messages to group members and managing user presence.
 */
@Service
public class MessageNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(MessageNotificationService.class);

    private final SimpMessageSendingOperations messagingTemplate;
    private final GroupMembershipService groupMembershipService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    public MessageNotificationService(SimpMessageSendingOperations messagingTemplate,
                                    GroupMembershipService groupMembershipService) {
        this.messagingTemplate = messagingTemplate;
        this.groupMembershipService = groupMembershipService;
    }

    /**
     * Broadcasts a new message to all group members via WebSocket.
     */
    public void broadcastMessage(Message message, MessageResponseDto messageResponse) {
        Long groupId = message.getGroup().getId();
        
        // Send to group topic for all connected group members
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/messages", messageResponse);
        
        // Send push notifications to offline members
        notifyOfflineMembers(message);
    }

    /**
     * Broadcasts message edit notification to group members.
     */
    public void broadcastMessageEdit(Message message, MessageResponseDto messageResponse) {
        Long groupId = message.getGroup().getId();
        
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/message-edited", messageResponse);
    }

    /**
     * Broadcasts message deletion notification to group members.
     */
    public void broadcastMessageDeletion(Long groupId, Long messageId, String deletedBy) {
        MessageDeletionNotification notification = new MessageDeletionNotification(messageId, deletedBy);
        
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/message-deleted", notification);
    }

    /**
     * Broadcasts typing indicator to group members.
     */
    public void broadcastTypingIndicator(Long groupId, String username, boolean isTyping) {
        TypingIndicator indicator = new TypingIndicator(username, isTyping);
        
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/typing", indicator);
    }

    /**
     * Broadcasts user presence update to all connected users.
     */
    public void broadcastPresenceUpdate(String username, PresenceStatus status) {
        PresenceUpdate update = new PresenceUpdate(username, status);
        
        messagingTemplate.convertAndSend("/topic/presence", update);
    }

    /**
     * Sends a private notification to a specific user.
     */
    public void sendPrivateNotification(String username, Object notification) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification);
    }

    /**
     * Sends error message to a specific user.
     */
    public void sendErrorToUser(String username, String errorMessage) {
        ErrorNotification error = new ErrorNotification(errorMessage);
        messagingTemplate.convertAndSendToUser(username, "/queue/errors", error);
    }

    /**
     * Notifies specific users about mentions in messages.
     */
    public void notifyMentionedUsers(Message message, List<String> mentionedUsernames) {
        for (String username : mentionedUsernames) {
            MentionNotification mention = new MentionNotification(
                message.getId(),
                message.getGroup().getId(),
                message.getGroup().getGroupName(),
                message.getSender().getUsername(),
                message.getContent()
            );
            
            sendPrivateNotification(username, mention);
        }
    }

    /**
     * Sends a notification to a specific user via WebSocket.
     * Used by the NotificationService for real-time notification delivery.
     */
    public void sendNotificationToUser(Long userId, Notification notification) {
        try {
            // Find user by ID to get username for WebSocket routing
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                NotificationWebSocketDto notificationDto = new NotificationWebSocketDto(
                    notification.getId(),
                    notification.getType().name(),
                    notification.getTitle(),
                    notification.getContent(),
                    notification.getActionUrl(),
                    notification.getPriority().name(),
                    notification.getCreatedAt()
                );

                messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/notifications",
                    notificationDto
                );

                logger.debug("Sent notification {} to user {} via WebSocket",
                            notification.getId(), user.getUsername());
            } else {
                logger.warn("User with ID {} not found for notification delivery", userId);
            }
        } catch (Exception e) {
            logger.error("Failed to send notification {} to user {} via WebSocket: {}",
                        notification.getId(), userId, e.getMessage());
        }
    }

    /**
     * Sends notifications to offline group members about new messages.
     */
    private void notifyOfflineMembers(Message message) {
        // This would integrate with a push notification service
        // For now, we'll just log that offline notifications should be sent
        Group group = message.getGroup();
        // TODO: Implement push notifications for offline users
        // This could integrate with Firebase, APNs, or other push services
    }

    // Notification DTOs
    public static class MessageDeletionNotification {
        private Long messageId;
        private String deletedBy;
        private long timestamp;

        public MessageDeletionNotification(Long messageId, String deletedBy) {
            this.messageId = messageId;
            this.deletedBy = deletedBy;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters and setters
        public Long getMessageId() {
            return messageId;
        }

        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }

        public String getDeletedBy() {
            return deletedBy;
        }

        public void setDeletedBy(String deletedBy) {
            this.deletedBy = deletedBy;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class TypingIndicator {
        private String username;
        private boolean isTyping;
        private long timestamp;

        public TypingIndicator(String username, boolean isTyping) {
            this.username = username;
            this.isTyping = isTyping;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters and setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public boolean isTyping() {
            return isTyping;
        }

        public void setTyping(boolean typing) {
            isTyping = typing;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class PresenceUpdate {
        private String username;
        private PresenceStatus status;
        private long timestamp;

        public PresenceUpdate(String username, PresenceStatus status) {
            this.username = username;
            this.status = status;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters and setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public PresenceStatus getStatus() {
            return status;
        }

        public void setStatus(PresenceStatus status) {
            this.status = status;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class ErrorNotification {
        private String error;
        private long timestamp;

        public ErrorNotification(String error) {
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters and setters
        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class MentionNotification {
        private Long messageId;
        private Long groupId;
        private String groupName;
        private String senderUsername;
        private String messageContent;
        private long timestamp;

        public MentionNotification(Long messageId, Long groupId, String groupName, 
                                 String senderUsername, String messageContent) {
            this.messageId = messageId;
            this.groupId = groupId;
            this.groupName = groupName;
            this.senderUsername = senderUsername;
            this.messageContent = messageContent;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters and setters
        public Long getMessageId() {
            return messageId;
        }

        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }

        public Long getGroupId() {
            return groupId;
        }

        public void setGroupId(Long groupId) {
            this.groupId = groupId;
        }

        public String getGroupName() {
            return groupName;
        }

        public void setGroupName(String groupName) {
            this.groupName = groupName;
        }

        public String getSenderUsername() {
            return senderUsername;
        }

        public void setSenderUsername(String senderUsername) {
            this.senderUsername = senderUsername;
        }

        public String getMessageContent() {
            return messageContent;
        }

        public void setMessageContent(String messageContent) {
            this.messageContent = messageContent;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }

    public enum PresenceStatus {
        ONLINE, AWAY, OFFLINE
    }

    public static class NotificationWebSocketDto {
        private Long id;
        private String type;
        private String title;
        private String content;
        private String actionUrl;
        private String priority;
        private LocalDateTime createdAt;
        private long timestamp;

        public NotificationWebSocketDto(Long id, String type, String title, String content,
                                       String actionUrl, String priority, LocalDateTime createdAt) {
            this.id = id;
            this.type = type;
            this.title = title;
            this.content = content;
            this.actionUrl = actionUrl;
            this.priority = priority;
            this.createdAt = createdAt;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters and setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getActionUrl() {
            return actionUrl;
        }

        public void setActionUrl(String actionUrl) {
            this.actionUrl = actionUrl;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
}
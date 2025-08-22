package com.circlebet.service.messaging;

import com.circlebet.dto.messaging.response.MessageResponseDto;
import com.circlebet.entity.group.Group;
import com.circlebet.entity.messaging.Message;
import com.circlebet.entity.user.User;
import com.circlebet.service.group.GroupMembershipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for sending real-time message notifications via WebSocket.
 * Handles broadcasting messages to group members and managing user presence.
 */
@Service
public class MessageNotificationService {

    private final SimpMessageSendingOperations messagingTemplate;
    private final GroupMembershipService groupMembershipService;

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
}
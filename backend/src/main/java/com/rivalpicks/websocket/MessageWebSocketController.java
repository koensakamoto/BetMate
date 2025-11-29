package com.rivalpicks.websocket;

import com.rivalpicks.dto.messaging.request.SendMessageRequestDto;
import com.rivalpicks.dto.messaging.response.MessageResponseDto;
import com.rivalpicks.entity.messaging.Message;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.service.group.GroupMembershipService;
import com.rivalpicks.service.messaging.MessageService;
import com.rivalpicks.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket controller for real-time messaging.
 * Handles WebSocket message sending and broadcasting to group members.
 */
@Controller
public class MessageWebSocketController {

    private final MessageService messageService;
    private final UserService userService;
    private final GroupMembershipService groupMembershipService;
    private final SimpMessageSendingOperations messagingTemplate;

    @Autowired
    public MessageWebSocketController(MessageService messageService,
                                    UserService userService,
                                    GroupMembershipService groupMembershipService,
                                    SimpMessageSendingOperations messagingTemplate) {
        this.messageService = messageService;
        this.userService = userService;
        this.groupMembershipService = groupMembershipService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Handle sending a message to a group via WebSocket.
     * Messages are broadcast to all group members in real-time.
     */
    @MessageMapping("/group/{groupId}/send")
    public void sendMessage(@DestinationVariable Long groupId,
                           @Payload SendMessageRequestDto request,
                           Principal principal) {
        System.out.println("\n========================================");
        System.out.println("[WS-MESSAGE] 📨 Received message send request");
        System.out.println("[WS-MESSAGE] User: " + principal.getName());
        System.out.println("[WS-MESSAGE] Group: " + groupId);
        System.out.println("[WS-MESSAGE] Content: " + request.getContent());
        System.out.println("========================================");

        try {
            // Get the authenticated user
            User currentUser = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
            System.out.println("[WS-MESSAGE] ✅ User found: " + currentUser.getUsername());

            // Manually check group membership (bypass @PreAuthorize for WebSocket context)
            if (!groupMembershipService.isActiveMember(groupId, principal.getName())) {
                System.out.println("[WS-MESSAGE] ❌ User is not an active member of group " + groupId);
                throw new SecurityException("User is not an active member of this group");
            }
            System.out.println("[WS-MESSAGE] ✅ User is active member of group " + groupId);

            // Ensure the request has the correct group ID
            request.setGroupId(groupId);

            // Create the message through the service
        MessageService.MessageCreateRequest createRequest = new MessageService.MessageCreateRequest(
                request.getGroupId(),
                request.getContent(),
                request.getMessageType(),
                request.getAttachmentUrl(),
                request.getAttachmentType(),
                request.getParentMessageId()
            );

            System.out.println("[WS-MESSAGE] 💾 Saving message to database...");
            Message savedMessage = messageService.postMessageWithoutAuth(createRequest, currentUser);
            System.out.println("[WS-MESSAGE] ✅ Message saved with ID: " + savedMessage.getId());

            // Convert to response DTO
            MessageResponseDto response = convertToMessageResponse(savedMessage, currentUser);
            System.out.println("[WS-MESSAGE] ✅ Message converted to DTO");

            // Broadcast the message to all users subscribed to the group topic
            String destination = "/topic/group/" + groupId + "/messages";
            System.out.println("[WS-MESSAGE] 📡 Broadcasting to: " + destination);
            messagingTemplate.convertAndSend(destination, response);
            System.out.println("[WS-MESSAGE] ✅ Message broadcast complete");
            System.out.println("========================================\n");

        } catch (Exception e) {
            System.out.println("[WS-MESSAGE] ❌ ERROR: " + e.getMessage());
            e.printStackTrace();
            System.out.println("========================================\n");

            // Send error back to the user who tried to send the message
            messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/errors",
                new WebSocketErrorResponse("Failed to send message: " + e.getMessage())
            );
        }
    }

    /**
     * Handle typing indicators for reanow l-time feedback.
     */
    @MessageMapping("/group/{groupId}/typing")
    public void handleTyping(@DestinationVariable Long groupId,
                           @Payload TypingIndicatorDto typingIndicator,
                           Principal principal) {
        try {
            // Add the username to the typing indicator
            typingIndicator.setUsername(principal.getName());
            
            // Broadcast typing indicator to all group members except the sender
            messagingTemplate.convertAndSend("/topic/group/" + groupId + "/typing", typingIndicator);
            
        } catch (Exception e) {
            // Silently ignore typing indicator errors to avoid disrupting the chat experience
        }
    }

    /**
     * Handle user presence updates (online/offline status).
     */
    @MessageMapping("/presence")
    public void updatePresence(@Payload UserPresenceDto presence, Principal principal) {
        try {
            presence.setUsername(principal.getName());
            
            // Broadcast presence update to all connected users
            messagingTemplate.convertAndSend("/topic/presence", presence);
            
        } catch (Exception e) {
            // Silently ignore presence errors
        }
    }

    /**
     * Send a private error message to a specific user.
     */
    @SendToUser("/queue/errors")
    public WebSocketErrorResponse sendError(String errorMessage) {
        return new WebSocketErrorResponse(errorMessage);
    }

    // Helper method to convert Message entity to DTO
    private MessageResponseDto convertToMessageResponse(Message message, User currentUser) {
        MessageResponseDto response = new MessageResponseDto();
        
        response.setId(message.getId());
        response.setGroupId(message.getGroup().getId());
        response.setGroupName(message.getGroup().getGroupName());
        
        if (message.getSender() != null) {
            response.setSenderId(message.getSender().getId());
            response.setSenderUsername(message.getSender().getUsername());
            response.setSenderDisplayName(message.getSender().getFullName()); // Use getFullName() to avoid lazy loading settings
        } else {
            // System message
            response.setSenderId(null);
            response.setSenderUsername("System");
            response.setSenderDisplayName("System");
        }
        
        response.setContent(message.getContent());
        response.setMessageType(message.getMessageType());
        response.setAttachmentUrl(message.getAttachmentUrl());
        response.setAttachmentType(message.getAttachmentType());
        response.setIsEdited(message.getIsEdited());
        response.setEditedAt(message.getEditedAt());
        response.setReplyCount(message.getReplyCount());
        
        if (message.getParentMessage() != null) {
            response.setParentMessageId(message.getParentMessage().getId());
        }
        
        response.setCreatedAt(message.getCreatedAt());
        response.setUpdatedAt(message.getUpdatedAt());
        
        // Set user permissions
        response.setCanEdit(messageService.canUserEditMessage(message.getId(), currentUser.getUsername()));
        response.setCanDelete(messageService.canUserDeleteMessage(message.getId(), currentUser.getUsername()));
        response.setCanReply(true); // All active members can reply
        
        return response;
    }

    // DTO classes for WebSocket communication
    public static class TypingIndicatorDto {
        private String username;
        private boolean isTyping;
        private Long groupId;

        public TypingIndicatorDto() {}

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

        public Long getGroupId() {
            return groupId;
        }

        public void setGroupId(Long groupId) {
            this.groupId = groupId;
        }
    }

    public static class UserPresenceDto {
        private String username;
        private PresenceStatus status;
        private String lastSeen;

        public UserPresenceDto() {}

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

        public String getLastSeen() {
            return lastSeen;
        }

        public void setLastSeen(String lastSeen) {
            this.lastSeen = lastSeen;
        }

        public enum PresenceStatus {
            ONLINE, AWAY, OFFLINE
        }
    }

    public static class WebSocketErrorResponse {
        private String error;
        private long timestamp;

        public WebSocketErrorResponse(String error) {
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }

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
}
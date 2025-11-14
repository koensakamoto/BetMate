package com.betmate.controller;

import com.betmate.dto.messaging.request.EditMessageRequestDto;
import com.betmate.dto.messaging.request.SendMessageRequestDto;
import com.betmate.dto.messaging.response.MessageResponseDto;
import com.betmate.dto.messaging.response.MessageThreadResponseDto;
import com.betmate.entity.messaging.Message;
import com.betmate.entity.user.User;
import com.betmate.entity.group.Group;
import com.betmate.service.messaging.MessageService;
import com.betmate.service.messaging.MessageNotificationService;
import com.betmate.service.user.UserService;
import com.betmate.service.group.GroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for messaging operations.
 * Handles sending, editing, deleting, and retrieving messages within groups.
 */
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;
    private final MessageNotificationService notificationService;
    private final UserService userService;
    private final GroupService groupService;

    @Autowired
    public MessageController(MessageService messageService,
                           MessageNotificationService notificationService,
                           UserService userService,
                           GroupService groupService) {
        this.messageService = messageService;
        this.notificationService = notificationService;
        this.userService = userService;
        this.groupService = groupService;
    }

    /**
     * Send a new message to a group.
     */
    @PostMapping
    public ResponseEntity<MessageResponseDto> sendMessage(
            @Valid @RequestBody SendMessageRequestDto request,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Convert DTO to service record
        MessageService.MessageCreateRequest createRequest = new MessageService.MessageCreateRequest(
            request.getGroupId(),
            request.getContent(),
            request.getMessageType(),
            request.getAttachmentUrl(),
            request.getAttachmentType(),
            request.getParentMessageId()
        );
        
        Message savedMessage = messageService.postMessage(createRequest, currentUser);
        MessageResponseDto response = convertToMessageResponse(savedMessage, currentUser);
        
        // Send real-time notification to group members
        notificationService.broadcastMessage(savedMessage, response);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get messages from a specific group with pagination.
     */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<Page<MessageResponseDto>> getGroupMessages(
            @PathVariable Long groupId,
            Pageable pageable,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Group group = groupService.getGroupById(groupId);
        Page<Message> messages = messageService.getGroupMessages(group, pageable);
        
        Page<MessageResponseDto> response = messages.map(message -> 
            convertToMessageResponse(message, currentUser));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get recent messages from a group.
     */
    @GetMapping("/group/{groupId}/recent")
    public ResponseEntity<List<MessageResponseDto>> getRecentGroupMessages(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Group group = groupService.getGroupById(groupId);
        List<Message> messages = messageService.getRecentGroupMessages(group, limit);

        List<MessageResponseDto> response = messages.stream()
            .map(message -> convertToMessageResponse(message, currentUser))
            .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Get messages from a group before a specific message ID (for pagination).
     * Returns messages in DESC order (newest first).
     */
    @GetMapping("/group/{groupId}/before/{messageId}")
    public ResponseEntity<List<MessageResponseDto>> getMessagesBeforeMessage(
            @PathVariable Long groupId,
            @PathVariable Long messageId,
            @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Group group = groupService.getGroupById(groupId);
        Message beforeMessage = messageService.getMessageById(messageId);

        List<Message> messages = messageService.getMessagesBefore(
            group,
            beforeMessage.getCreatedAt(),
            limit
        );

        List<MessageResponseDto> response = messages.stream()
            .map(message -> convertToMessageResponse(message, currentUser))
            .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Get a specific message by ID.
     */
    @GetMapping("/{messageId}")
    public ResponseEntity<MessageResponseDto> getMessage(
            @PathVariable Long messageId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Message message = messageService.getMessageById(messageId);
        MessageResponseDto response = convertToMessageResponse(message, currentUser);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get a message thread (parent message with its replies).
     */
    @GetMapping("/{messageId}/thread")
    public ResponseEntity<MessageThreadResponseDto> getMessageThread(
            @PathVariable Long messageId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Message parentMessage = messageService.getMessageById(messageId);
        List<Message> replies = messageService.getMessageReplies(parentMessage);
        
        MessageResponseDto parentResponse = convertToMessageResponse(parentMessage, currentUser);
        List<MessageResponseDto> replyResponses = replies.stream()
            .map(reply -> convertToMessageResponse(reply, currentUser))
            .toList();
        
        MessageThreadResponseDto response = new MessageThreadResponseDto(parentResponse, replyResponses);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Edit an existing message.
     */
    @PutMapping("/{messageId}")
    public ResponseEntity<MessageResponseDto> editMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody EditMessageRequestDto request,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Message editedMessage = messageService.editMessage(messageId, request.getContent());
        MessageResponseDto response = convertToMessageResponse(editedMessage, currentUser);
        
        // Send real-time notification about message edit
        notificationService.broadcastMessageEdit(editedMessage, response);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a message.
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId,
            Authentication authentication) {
        
        messageService.deleteMessage(messageId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Search messages within a group.
     */
    @GetMapping("/group/{groupId}/search")
    public ResponseEntity<List<MessageResponseDto>> searchMessages(
            @PathVariable Long groupId,
            @RequestParam String query,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Group group = groupService.getGroupById(groupId);
        List<Message> messages = messageService.searchMessages(group, query);
        
        List<MessageResponseDto> response = messages.stream()
            .map(message -> convertToMessageResponse(message, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get messages sent by the current user.
     */
    @GetMapping("/my-messages")
    public ResponseEntity<List<MessageResponseDto>> getMyMessages(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Message> messages = messageService.getUserMessages(currentUser);
        
        List<MessageResponseDto> response = messages.stream()
            .map(message -> convertToMessageResponse(message, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get message statistics for a group.
     */
    @GetMapping("/group/{groupId}/stats")
    public ResponseEntity<MessageService.MessageStats> getGroupMessageStats(
            @PathVariable Long groupId,
            Authentication authentication) {
        
        Group group = groupService.getGroupById(groupId);
        MessageService.MessageStats stats = messageService.getGroupMessageStats(group);
        
        return ResponseEntity.ok(stats);
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
}
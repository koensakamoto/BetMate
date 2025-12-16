package com.rivalpicks.service.messaging;

import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.messaging.Message;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.event.messaging.MessageCreatedEvent;
import com.rivalpicks.repository.messaging.MessageRepository;
import com.rivalpicks.service.group.GroupService;
import com.rivalpicks.exception.messaging.MessageNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Core message management service handling chat operations and message data.
 * Integrates with GroupService to update chat metadata.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class MessageService {

    private final MessageRepository messageRepository;
    private final GroupService groupService;
    private final ApplicationEventPublisher eventPublisher;

    // Pattern to match @username mentions in messages
    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    @Autowired
    public MessageService(MessageRepository messageRepository, GroupService groupService,
                         ApplicationEventPublisher eventPublisher) {
        this.messageRepository = messageRepository;
        this.groupService = groupService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Retrieves a message by ID.
     */
    public Message getMessageById(@NotNull Long messageId) {
        return messageRepository.findById(messageId)
            .filter(message -> !message.isDeleted())
            .orElseThrow(() -> new MessageNotFoundException("Message not found: " + messageId));
    }

    /**
     * Retrieves all active messages in a group ordered by creation time.
     */
    @PreAuthorize("@groupMembershipService.isMember(#group.id, authentication.name)")
    public List<Message> getGroupMessages(@NotNull Group group) {
        return messageRepository.findActiveMessagesByGroup(group);
    }

    /**
     * Retrieves paginated messages in a group.
     */
    @PreAuthorize("@groupMembershipService.isMember(#group.id, authentication.name)")
    public Page<Message> getGroupMessages(@NotNull Group group, @NotNull Pageable pageable) {
        return messageRepository.findByGroupAndDeletedAtIsNull(group, 
            PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), 
            Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    /**
     * Retrieves recent messages from a group (last N messages).
     */
    @PreAuthorize("@groupMembershipService.isMember(#group.id, authentication.name)")
    public List<Message> getRecentGroupMessages(@NotNull Group group, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return messageRepository.findByGroupAndDeletedAtIsNull(group, pageable).getContent();
    }

    /**
     * Retrieves messages from a group before a specific timestamp (for pagination).
     * Returns messages in DESC order (newest first).
     */
    @PreAuthorize("@groupMembershipService.isMember(#group.id, authentication.name)")
    public List<Message> getMessagesBefore(@NotNull Group group, @NotNull LocalDateTime before, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return messageRepository.findMessagesBefore(group, before, pageable);
    }

    /**
     * Retrieves all replies to a specific message.
     */
    public List<Message> getMessageReplies(@NotNull Message parentMessage) {
        return messageRepository.findByParentMessageOrderByCreatedAt(parentMessage);
    }

    /**
     * Retrieves messages sent by a specific user.
     */
    public List<Message> getUserMessages(@NotNull User sender) {
        return messageRepository.findBySenderOrderByCreatedAtDesc(sender);
    }

    /**
     * Searches for messages containing specific text within a group.
     */
    @PreAuthorize("@groupMembershipService.isMember(#group.id, authentication.name)")
    public List<Message> searchMessages(@NotNull Group group, @NotNull String searchTerm) {
        if (searchTerm.trim().isEmpty()) {
            return List.of();
        }
        return messageRepository.searchMessagesInGroup(group, searchTerm.trim());
    }

    /**
     * Posts a new message to a group.
     */
    @Transactional
    @PreAuthorize("@groupMembershipService.isActiveMember(#request.groupId(), authentication.name)")
    public Message postMessage(@NotNull @Valid MessageCreateRequest request, @NotNull User sender) {
        return postMessageInternal(request, sender);
    }

    /**
     * Posts a message to a group without @PreAuthorize (for use by WebSocket controller after manual auth check).
     */
    @Transactional
    public Message postMessageWithoutAuth(@NotNull @Valid MessageCreateRequest request, @NotNull User sender) {
        return postMessageInternal(request, sender);
    }

    /**
     * Internal method to post a message (shared by postMessage and postMessageWithoutAuth).
     */
    private Message postMessageInternal(@NotNull @Valid MessageCreateRequest request, @NotNull User sender) {
        Group group = groupService.getGroupById(request.groupId());

        Message message = new Message();
        message.setGroup(group);
        message.setSender(sender);
        message.setContent(request.content().trim());
        message.setMessageType(request.messageType());
        message.setAttachmentUrl(request.attachmentUrl());
        message.setAttachmentType(request.attachmentType());

        // Handle reply
        if (request.parentMessageId() != null) {
            Message parentMessage = getMessageById(request.parentMessageId());
            if (!parentMessage.getGroup().getId().equals(group.getId())) {
                throw new IllegalArgumentException("Cannot reply to message from different group");
            }
            message.setParentMessage(parentMessage);
            parentMessage.incrementReplyCount();
            messageRepository.save(parentMessage);
        }

        Message savedMessage = messageRepository.save(message);

        // Update group chat metadata
        groupService.updateChatMetadata(group.getId(), sender);

        // Publish message created event for notifications
        publishMessageCreatedEvent(savedMessage);

        return savedMessage;
    }

    /**
     * Posts a system message to a group (for automated notifications).
     */
    @Transactional
    public Message postSystemMessage(@NotNull Long groupId, @NotNull String content) {
        Group group = groupService.getGroupById(groupId);
        
        Message message = new Message();
        message.setGroup(group);
        message.setSender(null); // System messages have no sender
        message.setContent(content.trim());
        message.setMessageType(Message.MessageType.SYSTEM);

        return messageRepository.save(message);
    }

    /**
     * Edits an existing message.
     */
    @Transactional
    @PreAuthorize("@messageService.canUserEditMessage(#messageId, authentication.name)")
    public Message editMessage(@NotNull Long messageId, @NotNull String newContent) {
        Message message = getMessageById(messageId);
        
        if (message.getMessageType() == Message.MessageType.SYSTEM) {
            throw new IllegalArgumentException("Cannot edit system messages");
        }

        message.editContent(newContent.trim());
        return messageRepository.save(message);
    }

    /**
     * Deletes a message (soft delete).
     */
    @Transactional
    @PreAuthorize("@messageService.canUserDeleteMessage(#messageId, authentication.name)")
    public void deleteMessage(@NotNull Long messageId) {
        Message message = getMessageById(messageId);
        
        // If this is a parent message with replies, we might want to handle differently
        if (message.hasReplies()) {
            // Option 1: Replace content with "[deleted]" but keep structure
            message.setContent("[This message has been deleted]");
            message.setIsActive(false);
        } else {
            // Option 2: Full soft delete
            message.delete();
        }

        // Update parent reply count if this is a reply
        if (message.isReply()) {
            Message parent = message.getParentMessage();
            parent.decrementReplyCount();
            messageRepository.save(parent);
        }

        messageRepository.save(message);
    }

    /**
     * Gets message statistics for a group.
     */
    @PreAuthorize("@groupMembershipService.isMember(#group.id, authentication.name)")
    public MessageStats getGroupMessageStats(@NotNull Group group) {
        Long totalMessages = messageRepository.countMessagesByGroup(group);
        Long todayMessages = messageRepository.countMessagesByGroupBetween(
            group, LocalDateTime.now().toLocalDate().atStartOfDay(), LocalDateTime.now());
        
        return new MessageStats(totalMessages, todayMessages);
    }

    /**
     * Gets messages mentioning a specific user.
     */
    public List<Message> getMessagesMentioningUser(@NotNull String username) {
        return messageRepository.findMessagesMentioningUser(username);
    }

    /**
     * Gets the latest message per group for dashboard/overview.
     */
    public List<Message> getLatestMessagesPerGroup() {
        return messageRepository.findLatestMessagePerGroup();
    }

    /**
     * Gets message activity data for analytics.
     */
    public List<Object[]> getMessageActivityByDay(@NotNull LocalDateTime since) {
        return messageRepository.getMessageActivityByDay(since);
    }

    /**
     * Gets today's message count across all groups.
     */
    public Long getTodayMessageCount() {
        return messageRepository.countMessagesToday(
            LocalDateTime.now().toLocalDate().atStartOfDay());
    }

    // ==========================================
    // PERMISSION HELPER METHODS
    // ==========================================

    /**
     * Checks if a user can edit a specific message.
     */
    public boolean canUserEditMessage(@NotNull Long messageId, @NotNull String username) {
        try {
            Message message = getMessageById(messageId);
            return message.getSender() != null && 
                   message.getSender().getUsername().equals(username) &&
                   message.getMessageType() != Message.MessageType.SYSTEM;
        } catch (MessageNotFoundException e) {
            return false;
        }
    }

    /**
     * Checks if a user can delete a specific message.
     */
    public boolean canUserDeleteMessage(@NotNull Long messageId, @NotNull String username) {
        try {
            Message message = getMessageById(messageId);
            // User can delete their own messages, or admins can delete any messages
            return (message.getSender() != null && 
                    message.getSender().getUsername().equals(username)) ||
                   hasAdminRightsInGroup(message.getGroup().getId(), username);
        } catch (MessageNotFoundException e) {
            return false;
        }
    }

    private boolean hasAdminRightsInGroup(Long groupId, String username) {
        // This would be implemented by checking GroupMembership roles
        // For now, we'll assume only the message sender can delete
        return false;
    }

    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);

    /**
     * Publishes a message created event for notification processing.
     */
    private void publishMessageCreatedEvent(Message message) {
        try {
            logger.info("Publishing MESSAGE_CREATED event for message {} in group {}",
                       message.getId(), message.getGroup().getId());

            // Extract mentions from message content
            List<String> mentionedUsernames = extractMentionsFromMessage(message.getContent());

            MessageCreatedEvent event = new MessageCreatedEvent(
                message.getId(),
                message.getContent(),
                message.getSender().getId(),
                message.getSender().getDisplayName(),
                message.getSender().getUsername(),
                message.getGroup().getId(),
                message.getGroup().getName(),
                null, // recipientId - not used for group messages
                false, // isDirectMessage - this is for group messages
                mentionedUsernames
            );

            eventPublisher.publishEvent(event);
            logger.info("MESSAGE_CREATED event published successfully for message {}", message.getId());
        } catch (Exception e) {
            logger.error("Failed to publish MESSAGE_CREATED event for message {}: {}",
                        message.getId(), e.getMessage(), e);
        }
    }

    /**
     * Extracts @username mentions from a message.
     */
    private List<String> extractMentionsFromMessage(String messageContent) {
        if (messageContent == null || messageContent.trim().isEmpty()) {
            return List.of();
        }

        Matcher matcher = MENTION_PATTERN.matcher(messageContent);
        return matcher.results()
            .map(matchResult -> matchResult.group(1)) // Extract just the username part
            .distinct() // Remove duplicates if someone is mentioned multiple times
            .toList();
    }

    // ==========================================
    // DTOs
    // ==========================================

    public record MessageCreateRequest(
        @NotNull Long groupId,
        @NotNull String content,
        Message.MessageType messageType,
        String attachmentUrl,
        String attachmentType,
        Long parentMessageId
    ) {
        public MessageCreateRequest {
            if (messageType == null) {
                messageType = Message.MessageType.TEXT;
            }
        }
    }

    public record MessageStats(
        Long totalMessages,
        Long todayMessages
    ) {}

}
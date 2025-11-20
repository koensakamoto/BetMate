package com.betmate.entity.messaging;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import com.betmate.entity.user.User;
import com.betmate.entity.group.Group;
import com.betmate.entity.group.GroupMembership;

/**
 * Message entity representing a message posted in a group.
 * 
 * This entity handles all messaging within groups, including regular messages,
 * replies, and system messages.
 */
@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_message_group", columnList = "group_id"),
    @Index(name = "idx_message_sender", columnList = "sender_id"),
    @Index(name = "idx_message_created", columnList = "createdAt"),
    @Index(name = "idx_message_parent", columnList = "parent_message_id"),
    @Index(name = "idx_message_type", columnList = "messageType"),
    @Index(name = "idx_message_active", columnList = "isActive"),
    @Index(name = "idx_message_group_created", columnList = "group_id, createdAt")
})
public class Message {
    
    // ==========================================
    // IDENTITY
    // ==========================================
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // RELATIONSHIPS
    // ==========================================
    
    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne
    @JoinColumn(name = "parent_message_id")
    private Message parentMessage;

    // ==========================================
    // MESSAGE CONTENT
    // ==========================================
    
    @Column(nullable = false, length = 2000)
    @Size(min = 1, max = 2000, message = "Message content must be between 1 and 2000 characters")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType messageType = MessageType.TEXT;

    @Column(length = 500)
    private String attachmentUrl;

    @Column(length = 100)
    private String attachmentType;

    // ==========================================
    // MESSAGE METADATA
    // ==========================================
    
    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean isEdited = false;

    private LocalDateTime editedAt;

    @Column(nullable = false)
    private Integer replyCount = 0;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==========================================
    // RELATIONSHIPS - COLLECTIONS
    // ==========================================
    
    @OneToMany(mappedBy = "parentMessage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> replies;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================
    
    // Identity
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }

    // Relationships
    public Group getGroup() {
        return group;
    }
    
    public void setGroup(Group group) {
        this.group = group;
    }

    public User getSender() {
        return sender;
    }
    
    public void setSender(User sender) {
        this.sender = sender;
    }

    public Message getParentMessage() {
        return parentMessage;
    }
    
    public void setParentMessage(Message parentMessage) {
        this.parentMessage = parentMessage;
    }

    // Message Content
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }

    public MessageType getMessageType() {
        return messageType;
    }
    
    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }
    
    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getAttachmentType() {
        return attachmentType;
    }
    
    public void setAttachmentType(String attachmentType) {
        this.attachmentType = attachmentType;
    }

    // Message Metadata
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsEdited() {
        return isEdited;
    }
    
    public void setIsEdited(Boolean isEdited) {
        this.isEdited = isEdited;
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }
    
    public void setEditedAt(LocalDateTime editedAt) {
        this.editedAt = editedAt;
    }

    public Integer getReplyCount() {
        return replyCount;
    }
    
    public void setReplyCount(Integer replyCount) {
        this.replyCount = replyCount;
    }

    // System Fields
    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }
    
    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Relationships - Collections
    public List<Message> getReplies() {
        return replies;
    }
    
    public void setReplies(List<Message> replies) {
        this.replies = replies;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if the message has been soft deleted.
     * 
     * @return true if message is marked as deleted
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if the message is active and not deleted.
     * 
     * @return true if message is active
     */
    public boolean isActiveMessage() {
        return isActive && !isDeleted();
    }

    /**
     * Checks if this is a reply to another message.
     * 
     * @return true if this message has a parent message
     */
    public boolean isReply() {
        return parentMessage != null;
    }

    /**
     * Checks if this is a top-level message (not a reply).
     * 
     * @return true if this message has no parent
     */
    public boolean isTopLevel() {
        return parentMessage == null;
    }

    /**
     * Checks if the message has any replies.
     * 
     * @return true if message has replies
     */
    public boolean hasReplies() {
        return replyCount > 0;
    }

    /**
     * Checks if the message has an attachment.
     * 
     * @return true if message has an attachment
     */
    public boolean hasAttachment() {
        return attachmentUrl != null && !attachmentUrl.trim().isEmpty();
    }

    /**
     * Checks if the given user is the sender of this message.
     * 
     * @param user the user to check
     * @return true if user is the sender
     */
    public boolean isSentBy(User user) {
        return sender != null && user != null && 
               sender.getId() != null && user.getId() != null &&
               sender.getId().equals(user.getId());
    }

    /**
     * Edits the message content and marks it as edited.
     * 
     * @param newContent the new message content
     */
    public void editContent(String newContent) {
        if (newContent != null && !newContent.trim().isEmpty()) {
            this.content = newContent.trim();
            this.isEdited = true;
            this.editedAt = LocalDateTime.now();
        }
    }

    /**
     * Soft deletes the message.
     */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
        this.isActive = false;
    }

    /**
     * Increments the reply count when a new reply is added.
     */
    public void incrementReplyCount() {
        replyCount++;
    }

    /**
     * Decrements the reply count when a reply is removed.
     */
    public void decrementReplyCount() {
        if (replyCount > 0) {
            replyCount--;
        }
    }

    /**
     * Gets the root message (top-level parent) of a reply chain.
     * 
     * @return the root message, or this message if it's already top-level
     */
    public Message getRootMessage() {
        Message current = this;
        while (current.getParentMessage() != null) {
            current = current.getParentMessage();
        }
        return current;
    }

    /**
     * Gets a preview of the message content (truncated if too long).
     * 
     * @param maxLength maximum length of the preview
     * @return truncated content with ellipsis if needed
     */
    public String getContentPreview(int maxLength) {
        if (content == null) {
            return "";
        }
        if (content.length() <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength - 3) + "...";
    }

    /**
     * Checks if the user can send this type of message based on their membership.
     * 
     * @param membership the user's group membership
     * @return true if user can send this message type
     */
    public boolean canUserSendMessageType(GroupMembership membership) {
        if (membership == null || !membership.isActiveMember()) {
            return false;
        }

        return switch (messageType) {
            case SYSTEM -> false; // Only system can send system messages
            case ANNOUNCEMENT -> membership.hasAdminPrivileges();
            default -> true; // Regular messages can be sent by any active member
        };
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Types of messages that can be sent in a group.
     */
    public enum MessageType {
        TEXT,           // Regular text message
        IMAGE,          // Image attachment
        FILE,           // File attachment
        SYSTEM,         // System-generated message (user joined, bet created, etc.)
        BET_REFERENCE,  // Message referencing a specific bet
        ANNOUNCEMENT    // Important group announcement
    }
}
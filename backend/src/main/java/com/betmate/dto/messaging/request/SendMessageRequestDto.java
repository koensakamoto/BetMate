package com.betmate.dto.messaging.request;

import com.betmate.entity.messaging.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for sending new messages.
 * Contains validation for message creation operations.
 */
public class SendMessageRequestDto {
    
    @NotNull(message = "Group ID is required")
    private Long groupId;
    
    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    private String content;
    
    private Message.MessageType messageType = Message.MessageType.TEXT;
    
    private Long parentMessageId; // For replies
    
    private String attachmentUrl;
    
    private String attachmentType;

    // Default constructor
    public SendMessageRequestDto() {}

    // Constructor
    public SendMessageRequestDto(Long groupId, String content) {
        this.groupId = groupId;
        this.content = content;
    }

    // Getters and setters
    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Message.MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(Message.MessageType messageType) {
        this.messageType = messageType;
    }

    public Long getParentMessageId() {
        return parentMessageId;
    }

    public void setParentMessageId(Long parentMessageId) {
        this.parentMessageId = parentMessageId;
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
}
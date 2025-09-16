package com.circlebet.event.messaging;

import com.circlebet.event.base.DomainEvent;

import java.util.List;

public class MessageCreatedEvent extends DomainEvent {
    private final Long messageId;
    private final String messageContent;
    private final Long senderId;
    private final String senderName;
    private final String senderUsername;
    private final Long groupId;
    private final String groupName;
    private final Long recipientId; // For direct messages
    private final boolean isDirectMessage;
    private final List<String> mentionedUsernames;

    public MessageCreatedEvent(Long messageId, String messageContent,
                              Long senderId, String senderName, String senderUsername,
                              Long groupId, String groupName,
                              Long recipientId, boolean isDirectMessage,
                              List<String> mentionedUsernames) {
        super("MESSAGE_CREATED");
        this.messageId = messageId;
        this.messageContent = messageContent;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderUsername = senderUsername;
        this.groupId = groupId;
        this.groupName = groupName;
        this.recipientId = recipientId;
        this.isDirectMessage = isDirectMessage;
        this.mentionedUsernames = mentionedUsernames != null ? mentionedUsernames : List.of();
    }

    public Long getMessageId() {
        return messageId;
    }

    public String getMessageContent() {
        return messageContent;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public boolean isDirectMessage() {
        return isDirectMessage;
    }

    public List<String> getMentionedUsernames() {
        return mentionedUsernames;
    }

    public boolean hasMentions() {
        return !mentionedUsernames.isEmpty();
    }

    public String getMessagePreview() {
        if (messageContent.length() <= 50) {
            return messageContent;
        }
        return messageContent.substring(0, 47) + "...";
    }
}
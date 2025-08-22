package com.circlebet.dto.messaging.response;

import java.util.List;

/**
 * Response DTO for message threads (parent message with replies).
 * Contains a parent message and its nested replies.
 */
public class MessageThreadResponseDto {
    
    private MessageResponseDto parentMessage;
    private List<MessageResponseDto> replies;
    private Integer totalReplies;
    private Boolean hasMoreReplies;

    // Default constructor
    public MessageThreadResponseDto() {}

    // Constructor
    public MessageThreadResponseDto(MessageResponseDto parentMessage, List<MessageResponseDto> replies) {
        this.parentMessage = parentMessage;
        this.replies = replies;
        this.totalReplies = replies != null ? replies.size() : 0;
        this.hasMoreReplies = false;
    }

    // Getters and setters
    public MessageResponseDto getParentMessage() {
        return parentMessage;
    }

    public void setParentMessage(MessageResponseDto parentMessage) {
        this.parentMessage = parentMessage;
    }

    public List<MessageResponseDto> getReplies() {
        return replies;
    }

    public void setReplies(List<MessageResponseDto> replies) {
        this.replies = replies;
        this.totalReplies = replies != null ? replies.size() : 0;
    }

    public Integer getTotalReplies() {
        return totalReplies;
    }

    public void setTotalReplies(Integer totalReplies) {
        this.totalReplies = totalReplies;
    }

    public Boolean getHasMoreReplies() {
        return hasMoreReplies;
    }

    public void setHasMoreReplies(Boolean hasMoreReplies) {
        this.hasMoreReplies = hasMoreReplies;
    }
}
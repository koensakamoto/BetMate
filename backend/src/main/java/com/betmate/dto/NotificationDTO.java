package com.betmate.dto;

import com.betmate.entity.messaging.Notification;
import java.time.LocalDateTime;

/**
 * DTO for Notification responses to prevent circular references
 */
public class NotificationDTO {
    private Long id;
    private Long userId;
    private String title;
    private String message;
    private String notificationType;
    private String priority;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String actionUrl;
    private Long relatedEntityId;
    private String relatedEntityType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor from entity
    public NotificationDTO(Notification notification) {
        this.id = notification.getId();
        this.userId = notification.getUser().getId();
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.notificationType = notification.getNotificationType().toString();
        this.priority = notification.getPriority().toString();
        this.isRead = notification.getIsRead();
        this.readAt = notification.getReadAt();
        this.actionUrl = notification.getActionUrl();
        this.relatedEntityId = notification.getRelatedEntityId();
        this.relatedEntityType = notification.getRelatedEntityType();
        this.createdAt = notification.getCreatedAt();
        this.updatedAt = notification.getUpdatedAt();
    }

    // Getters
    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getNotificationType() {
        return notificationType;
    }

    public String getPriority() {
        return priority;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public String getRelatedEntityType() {
        return relatedEntityType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
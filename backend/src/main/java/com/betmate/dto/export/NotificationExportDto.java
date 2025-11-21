package com.betmate.dto.export;

import com.betmate.entity.messaging.Notification;

import java.time.LocalDateTime;

/**
 * DTO for exporting notification data.
 */
public record NotificationExportDto(
    Long id,
    String title,
    String message,
    String notificationType,
    String priority,
    Boolean isRead,
    LocalDateTime readAt,
    Long relatedEntityId,
    String relatedEntityType,
    LocalDateTime createdAt
) {
    public static NotificationExportDto fromNotification(Notification notification) {
        return new NotificationExportDto(
            notification.getId(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getNotificationType() != null ? notification.getNotificationType().name() : null,
            notification.getPriority() != null ? notification.getPriority().name() : null,
            notification.getIsRead(),
            notification.getReadAt(),
            notification.getRelatedEntityId(),
            notification.getRelatedEntityType(),
            notification.getCreatedAt()
        );
    }
}

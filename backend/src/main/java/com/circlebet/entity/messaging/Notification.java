package com.circlebet.entity.messaging;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

import com.circlebet.entity.user.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Notification entity representing notifications sent to users.
 * 
 * This entity handles all types of notifications including bet results,
 * group invites, messages, achievements, and system notifications.
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "user_id"),
    @Index(name = "idx_notification_type", columnList = "notificationType"),
    @Index(name = "idx_notification_read", columnList = "isRead"),
    @Index(name = "idx_notification_created", columnList = "createdAt"),
    @Index(name = "idx_notification_priority", columnList = "priority"),
    @Index(name = "idx_notification_deleted", columnList = "deletedAt"),
    @Index(name = "idx_notification_user_read", columnList = "user_id, isRead"),
    @Index(name = "idx_notification_user_created", columnList = "user_id, createdAt"),
    @Index(name = "idx_notification_user_deleted", columnList = "user_id, deletedAt")
})
public class Notification {
    
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
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"notifications", "groupMemberships", "createdGroups", "passwordHash", "friendships", "bets", "messages", "achievements", "transactions"})
    private User user;

    // ==========================================
    // NOTIFICATION CONTENT
    // ==========================================
    
    @Column(nullable = false, length = 100)
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    private String title;

    @Column(nullable = false, length = 500)
    @Size(min = 1, max = 500, message = "Message must be between 1 and 500 characters")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationPriority priority = NotificationPriority.NORMAL;

    // ==========================================
    // NOTIFICATION STATUS
    // ==========================================
    
    @Column(nullable = false)
    private Boolean isRead = false;

    private LocalDateTime readAt;

    // ==========================================
    // RELATED ENTITY LINKING
    // ==========================================
    
    private Long relatedEntityId;

    @Column(length = 50)
    private String relatedEntityType;

    @Column(length = 200)
    private String actionUrl;

    // ==========================================
    // DELIVERY TRACKING
    // ==========================================
    
    @Column(nullable = false)
    private Boolean pushSent = false;

    @Column(nullable = false)
    private Boolean emailSent = false;

    private LocalDateTime pushSentAt;

    private LocalDateTime emailSentAt;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }

    // Notification Content
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }
    
    public void setNotificationType(NotificationType notificationType) {
        this.notificationType = notificationType;
    }

    public NotificationPriority getPriority() {
        return priority;
    }
    
    public void setPriority(NotificationPriority priority) {
        this.priority = priority;
    }

    // Notification Status
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    // Related Entity Linking
    public Long getRelatedEntityId() {
        return relatedEntityId;
    }
    
    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public String getRelatedEntityType() {
        return relatedEntityType;
    }
    
    public void setRelatedEntityType(String relatedEntityType) {
        this.relatedEntityType = relatedEntityType;
    }

    public String getActionUrl() {
        return actionUrl;
    }
    
    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    // Delivery Tracking
    public Boolean getPushSent() {
        return pushSent;
    }
    
    public void setPushSent(Boolean pushSent) {
        this.pushSent = pushSent;
    }

    public Boolean getEmailSent() {
        return emailSent;
    }
    
    public void setEmailSent(Boolean emailSent) {
        this.emailSent = emailSent;
    }

    public LocalDateTime getPushSentAt() {
        return pushSentAt;
    }
    
    public void setPushSentAt(LocalDateTime pushSentAt) {
        this.pushSentAt = pushSentAt;
    }

    public LocalDateTime getEmailSentAt() {
        return emailSentAt;
    }
    
    public void setEmailSentAt(LocalDateTime emailSentAt) {
        this.emailSentAt = emailSentAt;
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

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if the notification has been soft deleted (hidden from user).
     * 
     * @return true if notification is hidden from user
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if the notification should be visible to the user.
     * 
     * @return true if notification should be shown in user's notification list
     */
    public boolean isVisible() {
        return !isDeleted();
    }

    /**
     * Marks the notification as read and sets the read timestamp.
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    /**
     * Marks the notification as unread and clears the read timestamp.
     */
    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }

    /**
     * Soft deletes the notification (hides from user but keeps for analytics).
     */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Restores a deleted notification (makes it visible again).
     */
    public void restore() {
        this.deletedAt = null;
    }

    /**
     * Checks if the notification is high priority.
     * 
     * @return true if priority is HIGH or URGENT
     */
    public boolean isHighPriority() {
        return priority == NotificationPriority.HIGH || priority == NotificationPriority.URGENT;
    }

    /**
     * Checks if the notification has a related entity.
     * 
     * @return true if notification links to another entity
     */
    public boolean hasRelatedEntity() {
        return relatedEntityId != null && relatedEntityType != null;
    }

    /**
     * Marks push notification as sent.
     */
    public void markPushSent() {
        this.pushSent = true;
        this.pushSentAt = LocalDateTime.now();
    }

    /**
     * Marks email notification as sent.
     */
    public void markEmailSent() {
        this.emailSent = true;
        this.emailSentAt = LocalDateTime.now();
    }

    /**
     * Checks if notification has been delivered via any channel.
     * 
     * @return true if push or email was sent
     */
    public boolean isDelivered() {
        return pushSent || emailSent;
    }

    /**
     * Gets the age of the notification in days.
     * 
     * @return number of days since creation
     */
    public long getAgeInDays() {
        return java.time.temporal.ChronoUnit.DAYS.between(createdAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }

    /**
     * Checks if the notification is old (older than 30 days).
     * 
     * @return true if notification is older than 30 days
     */
    public boolean isOld() {
        return getAgeInDays() > 30;
    }

    /**
     * Sets the related entity information.
     * 
     * @param entityType the type of entity (BET, GROUP, USER, etc.)
     * @param entityId the ID of the related entity
     */
    public void setRelatedEntity(String entityType, Long entityId) {
        this.relatedEntityType = entityType;
        this.relatedEntityId = entityId;
    }

    /**
     * Creates an action URL for the notification.
     * 
     * @param baseUrl the base URL of the application
     * @return formatted action URL or null if no related entity
     */
    public String generateActionUrl(String baseUrl) {
        if (!hasRelatedEntity()) {
            return null;
        }
        
        return switch (relatedEntityType.toUpperCase()) {
            case "BET" -> baseUrl + "/bets/" + relatedEntityId;
            case "GROUP" -> baseUrl + "/groups/" + relatedEntityId;
            case "USER" -> baseUrl + "/users/" + relatedEntityId;
            case "MESSAGE" -> baseUrl + "/messages/" + relatedEntityId;
            default -> baseUrl + "/notifications/" + id;
        };
    }

    /**
     * Gets the notification type.
     *
     * @return notification type
     */
    public NotificationType getType() {
        return notificationType;
    }

    /**
     * Gets the notification content (message).
     *
     * @return notification content
     */
    public String getContent() {
        return message;
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Types of notifications in the system.
     */
    public enum NotificationType {
        // Betting related
        BET_RESULT,         // Bet was resolved with outcome
        BET_CREATED,        // New bet created in your group
        BET_DEADLINE,       // Bet deadline approaching
        BET_CANCELLED,      // Bet was cancelled
        
        // Financial
        CREDITS_RECEIVED,   // Credits added to account
        CREDITS_SPENT,      // Credits deducted from account
        DAILY_BONUS,        // Daily login bonus available
        
        // Group related
        GROUP_INVITE,       // Invited to join a group
        GROUP_JOINED,       // Someone joined your group
        GROUP_LEFT,         // Someone left your group
        GROUP_ROLE_CHANGED, // Your role in group changed
        
        // Social
        MESSAGE_MENTION,    // Mentioned in a group message
        MESSAGE_REPLY,      // Someone replied to your message
        FRIEND_REQUEST,     // Friend request received
        FRIEND_ACCEPTED,    // Friend request was accepted
        FRIEND_ACTIVITY,    // Friend won a bet or achieved something
        
        // Achievements
        ACHIEVEMENT_UNLOCKED, // New achievement earned
        STREAK_MILESTONE,     // Win streak milestone reached
        LEVEL_UP,            // User level increased
        
        // System
        SYSTEM_ANNOUNCEMENT, // Important system news
        MAINTENANCE,         // Scheduled maintenance notice
        ACCOUNT_WARNING,     // Account-related warning
        WELCOME             // Welcome message for new users
    }

    /**
     * Priority levels for notifications.
     */
    public enum NotificationPriority {
        LOW,        // Minor updates, can wait
        NORMAL,     // Standard notifications
        HIGH,       // Important notifications
        URGENT      // Critical notifications requiring immediate attention
    }
}
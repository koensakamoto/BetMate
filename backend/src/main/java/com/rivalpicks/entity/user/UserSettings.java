package com.rivalpicks.entity.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.rivalpicks.entity.messaging.Notification;
import com.rivalpicks.entity.messaging.Notification.NotificationType;

/**
 * UserSettings entity representing user preferences and configuration.
 * 
 * This entity handles user customization including notification preferences,
 * privacy settings, and app behavior preferences.
 */
@Entity
@Table(name = "user_settings", indexes = {
    @Index(name = "idx_settings_user", columnList = "user_id"),
    @Index(name = "idx_settings_push", columnList = "pushNotifications"),
    @Index(name = "idx_settings_profile", columnList = "profileVisibility")
})
public class UserSettings {
    
    // ==========================================
    // IDENTITY
    // ==========================================
    
    @Id
    private Long userId; // Same as User ID for 1:1 relationship

    // ==========================================
    // RELATIONSHIPS
    // ==========================================
    
    @OneToOne(optional = false)
    @JoinColumn(name = "user_id")
    @MapsId
    private User user;

    // ==========================================
    // PRIORITY 1: CRITICAL NOTIFICATIONS
    // ==========================================
    
    @Column(nullable = false)
    private Boolean pushNotifications = true;

    @Column(nullable = false)
    private Boolean betResultNotifications = true;

    @Column(nullable = false)
    private Boolean groupInviteNotifications = true;

    // ==========================================
    // BETTING NOTIFICATIONS
    // ==========================================

    @Column(nullable = false)
    private Boolean betCreatedNotifications = true;

    @Column(nullable = false)
    private Boolean betUpdatedNotifications = true;

    @Column(nullable = false)
    private Boolean betDeadlineNotifications = true;

    @Column(nullable = false)
    private Boolean betResolutionReminderNotifications = true;

    @Column(nullable = false)
    private Boolean betCancelledNotifications = true;

    @Column(nullable = false)
    private Boolean betFulfillmentNotifications = true;

    // ==========================================
    // GROUP NOTIFICATIONS
    // ==========================================

    @Column(nullable = false)
    private Boolean groupMessageNotifications = true;

    @Column(nullable = false)
    private Boolean groupMemberJoinedNotifications = true;

    @Column(nullable = false)
    private Boolean groupMemberLeftNotifications = true;

    @Column(nullable = false)
    private Boolean groupRoleChangedNotifications = true;

    @Column(nullable = false)
    private Boolean groupJoinRequestNotifications = true;

    @Column(nullable = false)
    private Boolean groupDeletedNotifications = true;

    // ==========================================
    // SOCIAL NOTIFICATIONS
    // ==========================================

    @Column(nullable = false)
    private Boolean friendNotifications = true;

    // ==========================================
    // SYSTEM NOTIFICATIONS
    // ==========================================

    @Column(nullable = false)
    private Boolean accountSecurityNotifications = true;

    @Column(nullable = false)
    private Boolean systemAnnouncementNotifications = true;

    @Column(nullable = false)
    private Boolean promotionNotifications = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProfileVisibility profileVisibility = ProfileVisibility.PUBLIC;

    // ==========================================
    // PRIORITY 2: IMPORTANT USER EXPERIENCE
    // ==========================================
    
    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.01", message = "Default bet amount must be at least 0.01")
    @DecimalMax(value = "1000.00", message = "Default bet amount cannot exceed 1000.00")
    private BigDecimal defaultBetAmount = new BigDecimal("10.00");

    @Column(nullable = false)
    private Boolean emailNotifications = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Theme theme = Theme.LIGHT;


    // ==========================================
    // PROFILE CUSTOMIZATION
    // ==========================================
    
    @Column(length = 50)
    private String timezone = "UTC";

    @Column(length = 100)
    private String displayName;

    @Column(length = 500)
    private String profilePictureUrl;

    @Column(length = 1000)
    private String bio;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

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
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }

    // Relationships
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
        // Note: userId is managed by @MapsId annotation, do not set it manually
    }

    // Priority 1: Critical Notifications
    public Boolean getPushNotifications() {
        return pushNotifications;
    }
    
    public void setPushNotifications(Boolean pushNotifications) {
        this.pushNotifications = pushNotifications;
    }

    public Boolean getBetResultNotifications() {
        return betResultNotifications;
    }
    
    public void setBetResultNotifications(Boolean betResultNotifications) {
        this.betResultNotifications = betResultNotifications;
    }

    public Boolean getGroupInviteNotifications() {
        return groupInviteNotifications;
    }
    
    public void setGroupInviteNotifications(Boolean groupInviteNotifications) {
        this.groupInviteNotifications = groupInviteNotifications;
    }

    // Betting Notifications
    public Boolean getBetCreatedNotifications() {
        return betCreatedNotifications;
    }

    public void setBetCreatedNotifications(Boolean betCreatedNotifications) {
        this.betCreatedNotifications = betCreatedNotifications;
    }

    public Boolean getBetUpdatedNotifications() {
        return betUpdatedNotifications;
    }

    public void setBetUpdatedNotifications(Boolean betUpdatedNotifications) {
        this.betUpdatedNotifications = betUpdatedNotifications;
    }

    public Boolean getBetDeadlineNotifications() {
        return betDeadlineNotifications;
    }

    public void setBetDeadlineNotifications(Boolean betDeadlineNotifications) {
        this.betDeadlineNotifications = betDeadlineNotifications;
    }

    public Boolean getBetResolutionReminderNotifications() {
        return betResolutionReminderNotifications;
    }

    public void setBetResolutionReminderNotifications(Boolean betResolutionReminderNotifications) {
        this.betResolutionReminderNotifications = betResolutionReminderNotifications;
    }

    public Boolean getBetCancelledNotifications() {
        return betCancelledNotifications;
    }

    public void setBetCancelledNotifications(Boolean betCancelledNotifications) {
        this.betCancelledNotifications = betCancelledNotifications;
    }

    public Boolean getBetFulfillmentNotifications() {
        return betFulfillmentNotifications;
    }

    public void setBetFulfillmentNotifications(Boolean betFulfillmentNotifications) {
        this.betFulfillmentNotifications = betFulfillmentNotifications;
    }

    // Group Notifications
    public Boolean getGroupMessageNotifications() {
        return groupMessageNotifications;
    }

    public void setGroupMessageNotifications(Boolean groupMessageNotifications) {
        this.groupMessageNotifications = groupMessageNotifications;
    }

    public Boolean getGroupMemberJoinedNotifications() {
        return groupMemberJoinedNotifications;
    }

    public void setGroupMemberJoinedNotifications(Boolean groupMemberJoinedNotifications) {
        this.groupMemberJoinedNotifications = groupMemberJoinedNotifications;
    }

    public Boolean getGroupMemberLeftNotifications() {
        return groupMemberLeftNotifications;
    }

    public void setGroupMemberLeftNotifications(Boolean groupMemberLeftNotifications) {
        this.groupMemberLeftNotifications = groupMemberLeftNotifications;
    }

    public Boolean getGroupRoleChangedNotifications() {
        return groupRoleChangedNotifications;
    }

    public void setGroupRoleChangedNotifications(Boolean groupRoleChangedNotifications) {
        this.groupRoleChangedNotifications = groupRoleChangedNotifications;
    }

    public Boolean getGroupJoinRequestNotifications() {
        return groupJoinRequestNotifications;
    }

    public void setGroupJoinRequestNotifications(Boolean groupJoinRequestNotifications) {
        this.groupJoinRequestNotifications = groupJoinRequestNotifications;
    }

    public Boolean getGroupDeletedNotifications() {
        return groupDeletedNotifications;
    }

    public void setGroupDeletedNotifications(Boolean groupDeletedNotifications) {
        this.groupDeletedNotifications = groupDeletedNotifications;
    }

    // Social Notifications
    public Boolean getFriendNotifications() {
        return friendNotifications;
    }

    public void setFriendNotifications(Boolean friendNotifications) {
        this.friendNotifications = friendNotifications;
    }

    // System Notifications
    public Boolean getAccountSecurityNotifications() {
        return accountSecurityNotifications;
    }

    public void setAccountSecurityNotifications(Boolean accountSecurityNotifications) {
        this.accountSecurityNotifications = accountSecurityNotifications;
    }

    public Boolean getSystemAnnouncementNotifications() {
        return systemAnnouncementNotifications;
    }

    public void setSystemAnnouncementNotifications(Boolean systemAnnouncementNotifications) {
        this.systemAnnouncementNotifications = systemAnnouncementNotifications;
    }

    public Boolean getPromotionNotifications() {
        return promotionNotifications;
    }

    public void setPromotionNotifications(Boolean promotionNotifications) {
        this.promotionNotifications = promotionNotifications;
    }

    public ProfileVisibility getProfileVisibility() {
        return profileVisibility;
    }
    
    public void setProfileVisibility(ProfileVisibility profileVisibility) {
        this.profileVisibility = profileVisibility;
    }

    // Priority 2: Important User Experience
    public BigDecimal getDefaultBetAmount() {
        return defaultBetAmount;
    }
    
    public void setDefaultBetAmount(BigDecimal defaultBetAmount) {
        this.defaultBetAmount = defaultBetAmount;
    }

    public Boolean getEmailNotifications() {
        return emailNotifications;
    }
    
    public void setEmailNotifications(Boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public Theme getTheme() {
        return theme;
    }
    
    public void setTheme(Theme theme) {
        this.theme = theme;
    }

    // Profile Customization
    public String getTimezone() {
        return timezone;
    }
    
    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getDisplayName() {
        return displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }
    
    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public String getBio() {
        return bio;
    }
    
    public void setBio(String bio) {
        this.bio = bio;
    }

    // System Fields
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
     * Checks if the user wants to receive a specific type of notification.
     * 
     * @param notificationType the type of notification to check
     * @return true if user wants to receive this notification type
     */
    public boolean shouldReceiveNotification(NotificationType notificationType) {
        if (!pushNotifications) {
            return false; // User disabled all push notifications
        }

        return switch (notificationType) {
            // Betting notifications
            case BET_RESULT -> betResultNotifications;
            case BET_CREATED -> betCreatedNotifications;
            case BET_UPDATED -> betUpdatedNotifications;
            case BET_DEADLINE -> betDeadlineNotifications;
            case BET_RESOLUTION_REMINDER -> betResolutionReminderNotifications;
            case BET_CANCELLED -> betCancelledNotifications;
            case BET_FULFILLMENT_SUBMITTED -> betFulfillmentNotifications;
            // Group notifications
            case GROUP_INVITE -> groupInviteNotifications;
            case GROUP_MESSAGE -> groupMessageNotifications;
            case GROUP_JOINED -> groupMemberJoinedNotifications;
            case GROUP_LEFT -> groupMemberLeftNotifications;
            case GROUP_ROLE_CHANGED -> groupRoleChangedNotifications;
            case GROUP_JOIN_REQUEST -> groupJoinRequestNotifications;
            case GROUP_DELETED -> groupDeletedNotifications;
            // Social notifications
            case FRIEND_REQUEST, FRIEND_ACCEPTED -> friendNotifications;
            // System notifications
            case ACCOUNT_WARNING -> accountSecurityNotifications;
            case SYSTEM_ANNOUNCEMENT, MAINTENANCE -> systemAnnouncementNotifications;
            // Default to true for other notification types (WELCOME, etc.)
            default -> true;
        };
    }

    /**
     * Checks if the user's profile is publicly visible.
     * 
     * @return true if profile is public
     */
    public boolean isProfilePublic() {
        return profileVisibility == ProfileVisibility.PUBLIC;
    }

    /**
     * Checks if the user's profile is completely private.
     * 
     * @return true if profile is private
     */
    public boolean isProfilePrivate() {
        return profileVisibility == ProfileVisibility.PRIVATE;
    }

    /**
     * Gets the user's preferred theme as a string.
     * 
     * @return theme name in lowercase
     */
    public String getThemeString() {
        return theme.name().toLowerCase();
    }

    /**
     * Checks if user prefers dark theme.
     * 
     * @return true if dark theme is selected
     */
    public boolean isDarkTheme() {
        return theme == Theme.DARK;
    }

    /**
     * Resets all notification settings to default (enabled).
     */
    public void resetNotificationDefaults() {
        // General
        this.pushNotifications = true;
        this.emailNotifications = false;
        // Betting
        this.betResultNotifications = true;
        this.betCreatedNotifications = true;
        this.betUpdatedNotifications = true;
        this.betDeadlineNotifications = true;
        this.betResolutionReminderNotifications = true;
        this.betCancelledNotifications = true;
        this.betFulfillmentNotifications = true;
        // Groups
        this.groupInviteNotifications = true;
        this.groupMessageNotifications = true;
        this.groupMemberJoinedNotifications = true;
        this.groupMemberLeftNotifications = true;
        this.groupRoleChangedNotifications = true;
        this.groupJoinRequestNotifications = true;
        this.groupDeletedNotifications = true;
        // Social
        this.friendNotifications = true;
        // System
        this.accountSecurityNotifications = true;
        this.systemAnnouncementNotifications = true;
        this.promotionNotifications = false;
    }

    /**
     * Gets the display name, falling back to user's first name or username.
     * 
     * @return effective display name for the user
     */
    public String getEffectiveDisplayName() {
        if (displayName != null && !displayName.trim().isEmpty()) {
            return displayName;
        }
        if (user != null) {
            if (user.getFirstName() != null && !user.getFirstName().trim().isEmpty()) {
                return user.getFirstName();
            }
            return user.getUsername();
        }
        return "User";
    }

    /**
     * Checks if user has a custom profile picture.
     * 
     * @return true if profile picture URL is set
     */
    public boolean hasProfilePicture() {
        return profilePictureUrl != null && !profilePictureUrl.trim().isEmpty();
    }

    /**
     * Checks if user has a bio.
     * 
     * @return true if bio is set
     */
    public boolean hasBio() {
        return bio != null && !bio.trim().isEmpty();
    }

    /**
     * Gets the user's timezone, falling back to UTC if not set.
     * 
     * @return timezone string
     */
    public String getEffectiveTimezone() {
        return (timezone != null && !timezone.trim().isEmpty()) ? timezone : "UTC";
    }

    /**
     * Creates default settings for a new user.
     *
     * @param user the user to create settings for
     * @return new UserSettings with default values
     */
    public static UserSettings createDefaultSettings(User user) {
        UserSettings settings = new UserSettings();
        settings.setUser(user); // @MapsId will automatically derive the ID from this relationship
        // All other fields will use their default values from field declarations
        return settings;
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Profile visibility levels.
     */
    public enum ProfileVisibility {
        PUBLIC,     // Anyone can see profile and stats
        PRIVATE     // Only friends can see full profile
    }

    /**
     * App theme options.
     */
    public enum Theme {
        LIGHT,      // Light theme (default)
        DARK,       // Dark theme
        AUTO        // Follow system theme (future feature)
    }
}
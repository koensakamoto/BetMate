package com.betmate.entity.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.betmate.entity.messaging.Notification;
import com.betmate.entity.messaging.Notification.NotificationType;

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
            case BET_RESULT -> betResultNotifications;
            case GROUP_INVITE -> groupInviteNotifications;
            case GROUP_JOINED, GROUP_LEFT, GROUP_ROLE_CHANGED -> groupInviteNotifications;
            default -> true; // Default to true for other notification types
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
        this.pushNotifications = true;
        this.betResultNotifications = true;
        this.groupInviteNotifications = true;
        this.emailNotifications = false;
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
        FRIENDS,    // Only friends can see full profile (if friends feature exists)
        PRIVATE     // Only user can see their own profile
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
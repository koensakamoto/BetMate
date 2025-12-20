package com.rivalpicks.dto.user;

import com.rivalpicks.entity.user.UserSettings;

/**
 * DTO for notification preferences.
 * Used for both request and response when getting/updating notification preferences.
 */
public record NotificationPreferencesDto(
    // General
    Boolean pushNotifications,
    Boolean emailNotifications,

    // Betting
    Boolean betResultNotifications,
    Boolean betCreatedNotifications,
    Boolean betUpdatedNotifications,
    Boolean betDeadlineNotifications,
    Boolean betResolutionReminderNotifications,
    Boolean betCancelledNotifications,
    Boolean betFulfillmentNotifications,

    // Groups
    Boolean groupInviteNotifications,
    Boolean groupMessageNotifications,
    Boolean groupMemberJoinedNotifications,
    Boolean groupMemberLeftNotifications,
    Boolean groupRoleChangedNotifications,
    Boolean groupJoinRequestNotifications,
    Boolean groupDeletedNotifications,

    // Social
    Boolean friendNotifications,

    // System
    Boolean accountSecurityNotifications,
    Boolean systemAnnouncementNotifications,
    Boolean promotionNotifications
) {
    /**
     * Creates a NotificationPreferencesDto from a UserSettings entity.
     *
     * @param settings the UserSettings entity
     * @return a new NotificationPreferencesDto with values from the entity
     */
    public static NotificationPreferencesDto fromEntity(UserSettings settings) {
        return new NotificationPreferencesDto(
            settings.getPushNotifications(),
            settings.getEmailNotifications(),
            settings.getBetResultNotifications(),
            settings.getBetCreatedNotifications(),
            settings.getBetUpdatedNotifications(),
            settings.getBetDeadlineNotifications(),
            settings.getBetResolutionReminderNotifications(),
            settings.getBetCancelledNotifications(),
            settings.getBetFulfillmentNotifications(),
            settings.getGroupInviteNotifications(),
            settings.getGroupMessageNotifications(),
            settings.getGroupMemberJoinedNotifications(),
            settings.getGroupMemberLeftNotifications(),
            settings.getGroupRoleChangedNotifications(),
            settings.getGroupJoinRequestNotifications(),
            settings.getGroupDeletedNotifications(),
            settings.getFriendNotifications(),
            settings.getAccountSecurityNotifications(),
            settings.getSystemAnnouncementNotifications(),
            settings.getPromotionNotifications()
        );
    }

    /**
     * Creates a NotificationPreferencesDto with default values.
     *
     * @return a new NotificationPreferencesDto with default values
     */
    public static NotificationPreferencesDto defaults() {
        return new NotificationPreferencesDto(
            true,   // pushNotifications
            false,  // emailNotifications
            true,   // betResultNotifications
            true,   // betCreatedNotifications
            true,   // betUpdatedNotifications
            true,   // betDeadlineNotifications
            true,   // betResolutionReminderNotifications
            true,   // betCancelledNotifications
            true,   // betFulfillmentNotifications
            true,   // groupInviteNotifications
            true,   // groupMessageNotifications
            true,   // groupMemberJoinedNotifications
            true,   // groupMemberLeftNotifications
            true,   // groupRoleChangedNotifications
            true,   // groupJoinRequestNotifications
            true,   // groupDeletedNotifications
            true,   // friendNotifications
            true,   // accountSecurityNotifications
            true,   // systemAnnouncementNotifications
            false   // promotionNotifications
        );
    }

    /**
     * Applies the values from this DTO to a UserSettings entity.
     * Only non-null values are applied.
     *
     * @param settings the UserSettings entity to update
     */
    public void applyTo(UserSettings settings) {
        if (pushNotifications != null) settings.setPushNotifications(pushNotifications);
        if (emailNotifications != null) settings.setEmailNotifications(emailNotifications);
        if (betResultNotifications != null) settings.setBetResultNotifications(betResultNotifications);
        if (betCreatedNotifications != null) settings.setBetCreatedNotifications(betCreatedNotifications);
        if (betUpdatedNotifications != null) settings.setBetUpdatedNotifications(betUpdatedNotifications);
        if (betDeadlineNotifications != null) settings.setBetDeadlineNotifications(betDeadlineNotifications);
        if (betResolutionReminderNotifications != null) settings.setBetResolutionReminderNotifications(betResolutionReminderNotifications);
        if (betCancelledNotifications != null) settings.setBetCancelledNotifications(betCancelledNotifications);
        if (betFulfillmentNotifications != null) settings.setBetFulfillmentNotifications(betFulfillmentNotifications);
        if (groupInviteNotifications != null) settings.setGroupInviteNotifications(groupInviteNotifications);
        if (groupMessageNotifications != null) settings.setGroupMessageNotifications(groupMessageNotifications);
        if (groupMemberJoinedNotifications != null) settings.setGroupMemberJoinedNotifications(groupMemberJoinedNotifications);
        if (groupMemberLeftNotifications != null) settings.setGroupMemberLeftNotifications(groupMemberLeftNotifications);
        if (groupRoleChangedNotifications != null) settings.setGroupRoleChangedNotifications(groupRoleChangedNotifications);
        if (groupJoinRequestNotifications != null) settings.setGroupJoinRequestNotifications(groupJoinRequestNotifications);
        if (groupDeletedNotifications != null) settings.setGroupDeletedNotifications(groupDeletedNotifications);
        if (friendNotifications != null) settings.setFriendNotifications(friendNotifications);
        if (accountSecurityNotifications != null) settings.setAccountSecurityNotifications(accountSecurityNotifications);
        if (systemAnnouncementNotifications != null) settings.setSystemAnnouncementNotifications(systemAnnouncementNotifications);
        if (promotionNotifications != null) settings.setPromotionNotifications(promotionNotifications);
    }
}

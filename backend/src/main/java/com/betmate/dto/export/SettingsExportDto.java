package com.betmate.dto.export;

import com.betmate.entity.user.UserSettings;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for exporting user settings data.
 */
public record SettingsExportDto(
    Boolean pushNotifications,
    Boolean emailNotifications,
    Boolean betResultNotifications,
    Boolean groupInviteNotifications,
    String profileVisibility,
    String theme,
    String timezone,
    String displayName,
    BigDecimal defaultBetAmount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static SettingsExportDto fromUserSettings(UserSettings settings) {
        if (settings == null) {
            return null;
        }
        return new SettingsExportDto(
            settings.getPushNotifications(),
            settings.getEmailNotifications(),
            settings.getBetResultNotifications(),
            settings.getGroupInviteNotifications(),
            settings.getProfileVisibility() != null ? settings.getProfileVisibility().name() : null,
            settings.getTheme() != null ? settings.getTheme().name() : null,
            settings.getTimezone(),
            settings.getDisplayName(),
            settings.getDefaultBetAmount(),
            settings.getCreatedAt(),
            settings.getUpdatedAt()
        );
    }
}

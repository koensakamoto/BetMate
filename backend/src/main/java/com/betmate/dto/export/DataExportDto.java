package com.betmate.dto.export;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Main DTO for user data export.
 * Contains all user-related data organized by category.
 */
public record DataExportDto(
    ExportMetadata metadata,
    ProfileExportDto profile,
    SettingsExportDto settings,
    List<BetExportDto> betsCreated,
    List<BetParticipationExportDto> betParticipations,
    List<TransactionExportDto> transactions,
    List<GroupMembershipExportDto> groupMemberships,
    List<NotificationExportDto> notifications
) {
    /**
     * Metadata about the export.
     */
    public record ExportMetadata(
        Long userId,
        String username,
        LocalDateTime exportedAt,
        String exportVersion
    ) {}
}

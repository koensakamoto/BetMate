package com.rivalpicks.dto.export;

import com.rivalpicks.entity.group.GroupMembership;

import java.time.LocalDateTime;

/**
 * DTO for exporting group membership data.
 */
public record GroupMembershipExportDto(
    Long id,
    Long groupId,
    String groupName,
    String status,
    String role,
    Integer totalBets,
    Integer totalWins,
    Integer totalLosses,
    LocalDateTime joinedAt,
    LocalDateTime leftAt,
    LocalDateTime lastActivityAt
) {
    public static GroupMembershipExportDto fromGroupMembership(GroupMembership membership) {
        return new GroupMembershipExportDto(
            membership.getId(),
            membership.getGroup() != null ? membership.getGroup().getId() : null,
            membership.getGroup() != null ? membership.getGroup().getName() : null,
            membership.getStatus() != null ? membership.getStatus().name() : null,
            membership.getRole() != null ? membership.getRole().name() : null,
            membership.getTotalBets(),
            membership.getTotalWins(),
            membership.getTotalLosses(),
            membership.getJoinedAt(),
            membership.getLeftAt(),
            membership.getLastActivityAt()
        );
    }
}

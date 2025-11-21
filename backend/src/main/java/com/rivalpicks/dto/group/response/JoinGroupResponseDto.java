package com.rivalpicks.dto.group.response;

import com.rivalpicks.entity.group.GroupMembership;

/**
 * Response DTO for group join requests.
 * Indicates whether the user was immediately added or if the request is pending approval.
 */
public record JoinGroupResponseDto(
    Long membershipId,
    String status,  // "APPROVED" or "PENDING"
    String message
) {
    public static JoinGroupResponseDto fromMembership(GroupMembership membership) {
        String statusStr = membership.getStatus().name();
        String message = statusStr.equals("APPROVED")
            ? "Successfully joined the group!"
            : "Join request submitted. Awaiting approval from group admins.";

        return new JoinGroupResponseDto(
            membership.getId(),
            statusStr,
            message
        );
    }
}

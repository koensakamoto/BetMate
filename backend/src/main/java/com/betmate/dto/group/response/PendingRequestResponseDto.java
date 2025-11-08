package com.betmate.dto.group.response;

import com.betmate.entity.group.GroupMembership;

import java.time.LocalDateTime;

/**
 * DTO for pending group join requests in API responses.
 */
public class PendingRequestResponseDto {

    private Long requestId;  // GroupMembership ID
    private Long userId;
    private String username;
    private String displayName;
    private String profilePictureUrl;
    private LocalDateTime requestedAt;

    // Constructors
    public PendingRequestResponseDto() {}

    public PendingRequestResponseDto(Long requestId, Long userId, String username, String displayName,
                                    String profilePictureUrl, LocalDateTime requestedAt) {
        this.requestId = requestId;
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.profilePictureUrl = profilePictureUrl;
        this.requestedAt = requestedAt;
    }

    // Static factory method to create from GroupMembership
    public static PendingRequestResponseDto fromGroupMembership(GroupMembership membership) {
        if (membership == null || membership.getUser() == null) {
            return null;
        }

        PendingRequestResponseDto dto = new PendingRequestResponseDto();
        dto.setRequestId(membership.getId());
        dto.setUserId(membership.getUser().getId());
        dto.setUsername(membership.getUser().getUsername());
        dto.setDisplayName(membership.getUser().getDisplayName());
        dto.setProfilePictureUrl(membership.getUser().getProfileImageUrl());
        dto.setRequestedAt(membership.getJoinedAt());

        return dto;
    }

    // Getters and setters
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
}

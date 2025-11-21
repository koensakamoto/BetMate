package com.rivalpicks.dto.user.response;

import com.rivalpicks.entity.user.User;

/**
 * Limited response DTO for user profile data when viewing restricted profiles.
 * Contains only basic public information, used when:
 * - Profile is set to PRIVATE and viewer is not the owner
 * - Profile is set to FRIENDS and viewer is not a friend
 */
public class LimitedUserProfileResponseDto {
    private Long id;
    private String username;
    private String displayName;
    private String profileImageUrl;
    private boolean isActive;
    private boolean isPrivate;
    private String message;

    public static LimitedUserProfileResponseDto fromUser(User user, String restrictionMessage) {
        LimitedUserProfileResponseDto response = new LimitedUserProfileResponseDto();
        response.id = user.getId();
        response.username = user.getUsername();
        response.displayName = user.getFullName();
        response.profileImageUrl = user.getProfileImageUrl();
        response.isActive = user.isActiveUser();
        response.isPrivate = true;
        response.message = restrictionMessage;
        return response;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public boolean isActive() { return isActive; }
    public boolean isPrivate() { return isPrivate; }
    public String getMessage() { return message; }
}

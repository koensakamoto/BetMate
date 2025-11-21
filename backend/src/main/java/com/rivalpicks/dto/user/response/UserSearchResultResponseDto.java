package com.rivalpicks.dto.user.response;

import com.rivalpicks.entity.user.User;

/**
 * Response DTO for user search results.
 * Contains minimal user information for search listings.
 */
public class UserSearchResultResponseDto {
    private Long id;
    private String username;
    private String displayName;
    private boolean isActive;

    public static UserSearchResultResponseDto fromUser(User user) {
        UserSearchResultResponseDto result = new UserSearchResultResponseDto();
        result.id = user.getId();
        result.username = user.getUsername();
        result.displayName = user.getFullName(); // Use getFullName() to avoid lazy loading settings
        result.isActive = user.getIsActive();
        return result;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public boolean isActive() { return isActive; }
}
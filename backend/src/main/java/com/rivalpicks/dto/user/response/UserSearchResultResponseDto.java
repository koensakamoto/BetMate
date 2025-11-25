package com.rivalpicks.dto.user.response;

import com.rivalpicks.entity.user.User;

/**
 * Response DTO for user search results.
 * Contains minimal user information for search listings.
 */
public class UserSearchResultResponseDto {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String profileImageUrl;
    private boolean isActive;

    public static UserSearchResultResponseDto fromUser(User user) {
        UserSearchResultResponseDto result = new UserSearchResultResponseDto();
        result.id = user.getId();
        result.username = user.getUsername();
        result.firstName = user.getFirstName();
        result.lastName = user.getLastName();
        result.profileImageUrl = user.getProfileImageUrl();
        result.isActive = user.getIsActive();
        return result;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public boolean isActive() { return isActive; }
}
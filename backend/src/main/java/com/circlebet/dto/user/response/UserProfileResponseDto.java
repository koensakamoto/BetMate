package com.circlebet.dto.user.response;

import com.circlebet.entity.user.User;

/**
 * Response DTO for user profile data.
 * Contains all public user information without sensitive fields.
 */
public class UserProfileResponseDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String displayName;
    private boolean emailVerified;
    private boolean isActive;
    private String createdAt;

    public static UserProfileResponseDto fromUser(User user) {
        UserProfileResponseDto response = new UserProfileResponseDto();
        response.id = user.getId();
        response.username = user.getUsername();
        response.email = user.getEmail();
        response.firstName = user.getFirstName();
        response.lastName = user.getLastName();
        response.displayName = user.getEffectiveDisplayName();
        response.emailVerified = user.getEmailVerified();
        response.isActive = user.getIsActive();
        response.createdAt = user.getCreatedAt().toString();
        return response;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getDisplayName() { return displayName; }
    public boolean isEmailVerified() { return emailVerified; }
    public boolean isActive() { return isActive; }
    public String getCreatedAt() { return createdAt; }
}
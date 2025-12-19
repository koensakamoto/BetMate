package com.rivalpicks.dto.user.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rivalpicks.entity.user.User;
import java.math.BigDecimal;

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
    private String bio;
    private String profileImageUrl;
    private String displayName;
    private boolean emailVerified;
    private boolean isActive;
    private String createdAt;
    private BigDecimal totalCredits;
    private Integer totalWins;
    private Integer totalLosses;
    private Double winRate;
    private boolean hasPassword;
    private String authProvider;

    public static UserProfileResponseDto fromUser(User user) {
        UserProfileResponseDto response = new UserProfileResponseDto();
        response.id = user.getId();
        response.username = user.getUsername();
        response.email = user.getEmail();
        response.firstName = user.getFirstName();
        response.lastName = user.getLastName();
        response.bio = user.getBio();
        response.profileImageUrl = user.getProfileImageUrl();
        response.displayName = user.getFullName(); // Use getFullName() to avoid lazy loading settings
        response.emailVerified = user.getEmailVerified();
        response.isActive = user.isActiveUser();
        response.createdAt = user.getCreatedAt().toString();
        response.totalCredits = user.getCreditBalance();
        response.totalWins = user.getWinCount();
        response.totalLosses = user.getLossCount();
        response.winRate = user.getWinRate();
        response.hasPassword = Boolean.TRUE.equals(user.getHasPassword());
        response.authProvider = user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL";
        return response;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getBio() { return bio; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public String getDisplayName() { return displayName; }
    public boolean isEmailVerified() { return emailVerified; }
    @JsonProperty("isActive")
    public boolean isActive() { return isActive; }
    public String getCreatedAt() { return createdAt; }
    public BigDecimal getTotalCredits() { return totalCredits; }
    public Integer getTotalWins() { return totalWins; }
    public Integer getTotalLosses() { return totalLosses; }
    public Double getWinRate() { return winRate; }
    public boolean isHasPassword() { return hasPassword; }
    public String getAuthProvider() { return authProvider; }
}
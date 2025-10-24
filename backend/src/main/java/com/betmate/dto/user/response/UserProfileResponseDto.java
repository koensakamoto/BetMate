package com.betmate.dto.user.response;

import com.betmate.entity.user.User;
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
    private String displayName;
    private boolean emailVerified;
    private boolean isActive;
    private String createdAt;
    private BigDecimal totalCredits;
    private Integer totalWins;
    private Integer totalLosses;
    private Double winRate;
    public static UserProfileResponseDto fromUser(User user) {
        UserProfileResponseDto response = new UserProfileResponseDto();
        response.id = user.getId();
        response.username = user.getUsername();
        response.email = user.getEmail();
        response.firstName = user.getFirstName();
        response.lastName = user.getLastName();
        response.bio = user.getBio();
        response.displayName = user.getFullName(); // Use getFullName() to avoid lazy loading settings
        response.emailVerified = user.getEmailVerified();
        response.isActive = user.isActiveUser();
        response.createdAt = user.getCreatedAt().toString();
        response.totalCredits = user.getCreditBalance();
        response.totalWins = user.getWinCount();
        response.totalLosses = user.getLossCount();
        response.winRate = user.getWinRate();
        return response;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getBio() { return bio; }
    public String getDisplayName() { return displayName; }
    public boolean isEmailVerified() { return emailVerified; }
    public boolean isActive() { return isActive; }
    public String getCreatedAt() { return createdAt; }
    public BigDecimal getTotalCredits() { return totalCredits; }
    public Integer getTotalWins() { return totalWins; }
    public Integer getTotalLosses() { return totalLosses; }
    public Double getWinRate() { return winRate; }
}
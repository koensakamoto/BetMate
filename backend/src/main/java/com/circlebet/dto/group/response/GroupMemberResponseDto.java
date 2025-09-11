package com.circlebet.dto.group.response;

import com.circlebet.entity.group.GroupMembership;

import java.time.LocalDateTime;

/**
 * DTO for group member information in API responses.
 */
public class GroupMemberResponseDto {
    
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String profilePictureUrl;
    private GroupMembership.MemberRole role;
    private Boolean isActive;
    private LocalDateTime joinedAt;
    private LocalDateTime lastActivityAt;
    private Integer totalBets;
    private Integer totalWins;
    private Integer totalLosses;
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public GroupMembership.MemberRole getRole() { return role; }
    public void setRole(GroupMembership.MemberRole role) { this.role = role; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public Integer getTotalBets() { return totalBets; }
    public void setTotalBets(Integer totalBets) { this.totalBets = totalBets; }

    public Integer getTotalWins() { return totalWins; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }

    public Integer getTotalLosses() { return totalLosses; }
    public void setTotalLosses(Integer totalLosses) { this.totalLosses = totalLosses; }

    // Utility methods
    public boolean isOnline() {
        if (lastActivityAt == null) return false;
        // Consider user online if active within last 5 minutes
        return lastActivityAt.isAfter(LocalDateTime.now().minusMinutes(5));
    }

    public double getWinRate() {
        int totalGames = totalWins + totalLosses;
        return totalGames == 0 ? 0.0 : (double) totalWins / totalGames;
    }
}
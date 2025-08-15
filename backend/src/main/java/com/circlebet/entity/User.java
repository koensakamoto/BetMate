package com.circlebet.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * User entity representing a registered user in the CircleBet platform.
 * 
 * This entity includes authentication, profile, security, analytics, and 
 * betting-related information for each user.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_username", columnList = "username"),
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_active", columnList = "isActive"),
    @Index(name = "idx_user_deleted_at", columnList = "deletedAt")
})
public class User {

    // ==========================================
    // IDENTITY
    // ==========================================
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // AUTHENTICATION & IDENTITY
    // ==========================================
    
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    // ==========================================
    // PROFILE INFORMATION
    // ==========================================
    
    @Column(length = 50)
    private String firstName;

    @Column(length = 50)
    private String lastName;

    @Column(length = 100)
    private String displayName;

    @Column(length = 500)
    private String profilePictureUrl;

    @Column(length = 1000)
    private String bio;

    // ==========================================
    // SECURITY & AUTHENTICATION
    // ==========================================
    
    @Column(nullable = false)
    private Boolean emailVerified = false;

    private LocalDateTime lastLoginAt;

    @Column(nullable = false)
    private Integer failedLoginAttempts = 0;

    private LocalDateTime accountLockedUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // ==========================================
    // USER PREFERENCES
    // ==========================================
    
    @Column(length = 50)
    private String timezone = "UTC";

    // ==========================================
    // BETTING ANALYTICS & STATISTICS
    // ==========================================
    
    @Column(nullable = false)
    private Integer winCount = 0;

    @Column(nullable = false)
    private Integer lossCount = 0;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal creditBalance = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer currentStreak = 0;

    @Column(nullable = false)
    private Integer longestStreak = 0;

    @Column(nullable = false)
    private Integer activeBets = 0;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    @Column(nullable = false)
    private Boolean isActive = true;

    // ==========================================
    // RELATIONSHIPS
    // ==========================================
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Group> createdGroups;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GroupMembership> groupMemberships;

    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Bet> createdBets;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BetParticipation> betParticipations;

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> sentMessages;

    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(Integer failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public LocalDateTime getAccountLockedUntil() { return accountLockedUntil; }
    public void setAccountLockedUntil(LocalDateTime accountLockedUntil) { this.accountLockedUntil = accountLockedUntil; }

    public AuthProvider getAuthProvider() { return authProvider; }
    public void setAuthProvider(AuthProvider authProvider) { this.authProvider = authProvider; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public Integer getWinCount() { return winCount; }
    public void setWinCount(Integer winCount) { this.winCount = winCount; }

    public Integer getLossCount() { return lossCount; }
    public void setLossCount(Integer lossCount) { this.lossCount = lossCount; }

    public BigDecimal getCreditBalance() { return creditBalance; }
    public void setCreditBalance(BigDecimal creditBalance) { this.creditBalance = creditBalance; }

    public Integer getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }

    public Integer getLongestStreak() { return longestStreak; }
    public void setLongestStreak(Integer longestStreak) { this.longestStreak = longestStreak; }

    public Integer getActiveBets() { return activeBets; }
    public void setActiveBets(Integer activeBets) { this.activeBets = activeBets; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    // Relationships
    public List<Group> getCreatedGroups() {
        return createdGroups;
    }
    
    public void setCreatedGroups(List<Group> createdGroups) {
        this.createdGroups = createdGroups;
    }

    public List<GroupMembership> getGroupMemberships() {
        return groupMemberships;
    }
    
    public void setGroupMemberships(List<GroupMembership> groupMemberships) {
        this.groupMemberships = groupMemberships;
    }

    public List<Bet> getCreatedBets() {
        return createdBets;
    }
    
    public void setCreatedBets(List<Bet> createdBets) {
        this.createdBets = createdBets;
    }

    public List<BetParticipation> getBetParticipations() {
        return betParticipations;
    }
    
    public void setBetParticipations(List<BetParticipation> betParticipations) {
        this.betParticipations = betParticipations;
    }

    public List<Message> getSentMessages() {
        return sentMessages;
    }
    
    public void setSentMessages(List<Message> sentMessages) {
        this.sentMessages = sentMessages;
    }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Utility methods
    public boolean isAccountLocked() {
        return accountLockedUntil != null && accountLockedUntil.isAfter(LocalDateTime.now());
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public double getWinRate() {
        int totalGames = winCount + lossCount;
        return totalGames == 0 ? 0.0 : (double) winCount / totalGames;
    }

    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        return displayName != null ? displayName : username;
    }

    /**
     * Calculates total games played by the user.
     * 
     * @return total number of wins and losses
     */
    public int getTotalGames() {
        return winCount + lossCount;
    }

    /**
     * Checks if the user is active (not disabled or deleted).
     * 
     * @return true if user is active and not deleted
     */
    public boolean isActiveUser() {
        return isActive && !isDeleted();
    }

    public enum AuthProvider {
        LOCAL, GOOGLE, FACEBOOK, GITHUB
    }
}

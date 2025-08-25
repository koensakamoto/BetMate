package com.circlebet.entity.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.circlebet.entity.group.Group;
import com.circlebet.entity.group.GroupMembership;
import com.circlebet.entity.betting.Bet;
import com.circlebet.entity.betting.BetParticipation;
import com.circlebet.entity.messaging.Message;
import com.circlebet.entity.messaging.Notification;

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
    @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$", message = "Username must be 3-50 characters, alphanumeric and underscore only")
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    @Email(message = "Invalid email format")
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
    // BETTING ANALYTICS & STATISTICS
    // ==========================================
    
    @Column(nullable = false)
    private Integer winCount = 0;

    @Column(nullable = false)
    private Integer lossCount = 0;

    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Credit balance cannot be negative")
    private BigDecimal creditBalance = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Frozen credits cannot be negative")
    private BigDecimal frozenCredits = BigDecimal.ZERO;

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

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Notification> notifications;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserSettings settings;

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

    public Integer getWinCount() { return winCount; }
    public void setWinCount(Integer winCount) { this.winCount = winCount; }

    public Integer getLossCount() { return lossCount; }
    public void setLossCount(Integer lossCount) { this.lossCount = lossCount; }

    public BigDecimal getCreditBalance() { return creditBalance; }
    public void setCreditBalance(BigDecimal creditBalance) { this.creditBalance = creditBalance; }

    public BigDecimal getFrozenCredits() { return frozenCredits; }
    public void setFrozenCredits(BigDecimal frozenCredits) { this.frozenCredits = frozenCredits; }

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

    public List<Notification> getNotifications() {
        return notifications;
    }
    
    public void setNotifications(List<Notification> notifications) {
        this.notifications = notifications;
    }

    public UserSettings getSettings() {
        return settings;
    }
    
    public void setSettings(UserSettings settings) {
        this.settings = settings;
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
        return username;
    }

    /**
     * Gets the display name from user settings, falling back to full name.
     * 
     * @return effective display name for the user
     */
    public String getEffectiveDisplayName() {
        if (settings != null) {
            return settings.getEffectiveDisplayName();
        }
        return getFullName();
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

    /**
     * Calculates available credits (total balance minus frozen credits).
     * 
     * @return available credits for spending
     */
    public BigDecimal getAvailableCredits() {
        return creditBalance.subtract(frozenCredits);
    }

    /**
     * Checks if user has sufficient available credits for a transaction.
     * 
     * @param amount the amount to check
     * @return true if user has sufficient available credits
     */
    public boolean hasSufficientAvailableCredits(BigDecimal amount) {
        return getAvailableCredits().compareTo(amount) >= 0;
    }

    public enum AuthProvider {
        LOCAL, GOOGLE
    }
}

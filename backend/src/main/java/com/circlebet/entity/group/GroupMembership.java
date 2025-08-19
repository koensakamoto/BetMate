package com.circlebet.entity.group;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.circlebet.entity.user.User;

/**
 * GroupMembership entity representing the relationship between users and groups.
 * 
 * This entity tracks membership status, roles, and activity within groups.
 */
@Entity
@Table(name = "group_memberships", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "group_id"}),
    indexes = {
        @Index(name = "idx_membership_user", columnList = "user_id"),
        @Index(name = "idx_membership_group", columnList = "group_id"),
        @Index(name = "idx_membership_status", columnList = "status"),
        @Index(name = "idx_membership_role", columnList = "role"),
        @Index(name = "idx_membership_active", columnList = "isActive"),
        @Index(name = "idx_membership_composite", columnList = "user_id, group_id, status")
    }
)
public class GroupMembership {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private Group group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipStatus status = MembershipStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role = MemberRole.MEMBER;

    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime lastActivityAt;

    @Column(nullable = false)
    private Integer totalBets = 0;

    @Column(nullable = false)
    private Integer totalWins = 0;

    @Column(nullable = false)
    private Integer totalLosses = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    private LocalDateTime leftAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }

    public MembershipStatus getStatus() { return status; }
    public void setStatus(MembershipStatus status) { this.status = status; }

    public MemberRole getRole() { return role; }
    public void setRole(MemberRole role) { this.role = role; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public Integer getTotalBets() { return totalBets; }
    public void setTotalBets(Integer totalBets) { this.totalBets = totalBets; }

    public Integer getTotalWins() { return totalWins; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }

    public Integer getTotalLosses() { return totalLosses; }
    public void setTotalLosses(Integer totalLosses) { this.totalLosses = totalLosses; }

    public LocalDateTime getJoinedAt() { return joinedAt; }

    public LocalDateTime getLeftAt() { return leftAt; }
    public void setLeftAt(LocalDateTime leftAt) { this.leftAt = leftAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Utility methods
    public boolean isActiveMember() {
        return isActive && status == MembershipStatus.APPROVED && leftAt == null;
    }

    public boolean hasAdminPrivileges() {
        return role == MemberRole.ADMIN || role == MemberRole.MODERATOR;
    }

    public boolean canManageMembers() {
        return role == MemberRole.ADMIN;
    }

    public double getWinRate() {
        int totalGames = totalWins + totalLosses;
        return totalGames == 0 ? 0.0 : (double) totalWins / totalGames;
    }

    public void updateActivity() {
        lastActivityAt = LocalDateTime.now();
    }

    public void recordBet() {
        totalBets++;
        updateActivity();
    }

    public void recordWin() {
        totalWins++;
        updateActivity();
    }

    public void recordLoss() {
        totalLosses++;
        updateActivity();
    }

    public void leave() {
        leftAt = LocalDateTime.now();
        isActive = false;
        status = MembershipStatus.LEFT;
    }

    public boolean hasLeft() {
        return leftAt != null;
    }

    public enum MembershipStatus {
        PENDING, APPROVED, REJECTED, BANNED, LEFT
    }

    public enum MemberRole {
        MEMBER, MODERATOR, ADMIN
    }
}
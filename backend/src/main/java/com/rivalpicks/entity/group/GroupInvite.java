package com.rivalpicks.entity.group;

import com.rivalpicks.entity.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Entity representing a group invite token.
 * Tokens allow users to join private groups directly via invite links.
 */
@Entity
@Table(name = "group_invites", indexes = {
    @Index(name = "idx_group_invite_token", columnList = "token"),
    @Index(name = "idx_group_invite_group", columnList = "group_id"),
    @Index(name = "idx_group_invite_created_by", columnList = "created_by_id"),
    @Index(name = "idx_group_invite_expires", columnList = "expiresAt")
})
public class GroupInvite {

    private static final int DEFAULT_EXPIRATION_DAYS = 7;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(nullable = true)
    private LocalDateTime expiresAt;

    @Column(nullable = true)
    private Integer maxUses;

    @Column(nullable = false)
    private Integer useCount = 0;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public GroupInvite() {
    }

    public GroupInvite(Group group, User createdBy) {
        this.group = group;
        this.createdBy = createdBy;
        this.token = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        this.expiresAt = this.createdAt.plusDays(DEFAULT_EXPIRATION_DAYS);
        this.isActive = true;
        this.useCount = 0;
    }

    public GroupInvite(Group group, User createdBy, Integer maxUses, Integer expirationDays) {
        this.group = group;
        this.createdBy = createdBy;
        this.token = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        this.maxUses = maxUses;
        this.isActive = true;
        this.useCount = 0;

        if (expirationDays != null && expirationDays > 0) {
            this.expiresAt = this.createdAt.plusDays(expirationDays);
        } else {
            this.expiresAt = null;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now(ZoneOffset.UTC);
        }
        if (token == null) {
            token = UUID.randomUUID().toString();
        }
    }

    /**
     * Checks if the invite token is valid (not expired, not at max uses, and active).
     */
    public boolean isValid() {
        if (!isActive) {
            return false;
        }
        if (expiresAt != null && LocalDateTime.now(ZoneOffset.UTC).isAfter(expiresAt)) {
            return false;
        }
        if (maxUses != null && useCount >= maxUses) {
            return false;
        }
        return true;
    }

    /**
     * Gets the reason why the invite is invalid.
     */
    public InvalidReason getInvalidReason() {
        if (!isActive) {
            return InvalidReason.REVOKED;
        }
        if (expiresAt != null && LocalDateTime.now(ZoneOffset.UTC).isAfter(expiresAt)) {
            return InvalidReason.EXPIRED;
        }
        if (maxUses != null && useCount >= maxUses) {
            return InvalidReason.MAX_USES_REACHED;
        }
        return null;
    }

    /**
     * Checks if the token has expired.
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now(ZoneOffset.UTC).isAfter(expiresAt);
    }

    /**
     * Checks if the token has reached max uses.
     */
    public boolean isMaxUsesReached() {
        return maxUses != null && useCount >= maxUses;
    }

    /**
     * Increments the use count when someone joins via this invite.
     */
    public void incrementUseCount() {
        this.useCount++;
    }

    /**
     * Deactivates this invite token.
     */
    public void revoke() {
        this.isActive = false;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Integer getMaxUses() {
        return maxUses;
    }

    public void setMaxUses(Integer maxUses) {
        this.maxUses = maxUses;
    }

    public Integer getUseCount() {
        return useCount;
    }

    public void setUseCount(Integer useCount) {
        this.useCount = useCount;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public enum InvalidReason {
        EXPIRED,
        MAX_USES_REACHED,
        REVOKED,
        INVALID
    }
}

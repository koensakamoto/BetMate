package com.rivalpicks.entity.security;

import com.rivalpicks.entity.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Entity representing a password reset token.
 * Tokens are single-use and expire after a configured duration.
 */
@Entity
@Table(name = "password_reset_tokens", indexes = {
    @Index(name = "idx_password_reset_token", columnList = "token"),
    @Index(name = "idx_password_reset_user", columnList = "user_id"),
    @Index(name = "idx_password_reset_expires", columnList = "expiresAt")
})
public class PasswordResetToken {

    private static final int EXPIRATION_HOURS = 1;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean used = false;

    @Column(nullable = false)
    private Integer failedAttempts = 0;

    private static final int MAX_FAILED_ATTEMPTS = 5;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime usedAt;

    public PasswordResetToken() {
    }

    public PasswordResetToken(User user) {
        this.user = user;
        this.token = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        this.expiresAt = this.createdAt.plusHours(EXPIRATION_HOURS);
        this.used = false;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now(ZoneOffset.UTC);
        }
        if (expiresAt == null) {
            expiresAt = createdAt.plusHours(EXPIRATION_HOURS);
        }
    }

    /**
     * Checks if the token is valid (not expired, not used, and not exceeded max failed attempts).
     */
    public boolean isValid() {
        return !used && failedAttempts < MAX_FAILED_ATTEMPTS && LocalDateTime.now(ZoneOffset.UTC).isBefore(expiresAt);
    }

    /**
     * Checks if the token has exceeded max failed attempts.
     */
    public boolean isLockedOut() {
        return failedAttempts >= MAX_FAILED_ATTEMPTS;
    }

    /**
     * Increments the failed attempt counter.
     * @return true if the token is now locked out (reached max attempts)
     */
    public boolean incrementFailedAttempts() {
        this.failedAttempts++;
        return this.failedAttempts >= MAX_FAILED_ATTEMPTS;
    }

    /**
     * Checks if the token has expired.
     */
    public boolean isExpired() {
        return LocalDateTime.now(ZoneOffset.UTC).isAfter(expiresAt);
    }

    /**
     * Marks the token as used.
     */
    public void markAsUsed() {
        this.used = true;
        this.usedAt = LocalDateTime.now(ZoneOffset.UTC);
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getUsed() {
        return used;
    }

    public void setUsed(Boolean used) {
        this.used = used;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public Integer getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(Integer failedAttempts) {
        this.failedAttempts = failedAttempts;
    }
}

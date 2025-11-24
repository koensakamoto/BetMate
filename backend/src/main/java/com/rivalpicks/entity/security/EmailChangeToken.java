package com.rivalpicks.entity.security;

import com.rivalpicks.entity.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Entity representing an email change verification token.
 * Tokens are single-use and expire after a configured duration.
 * Stores the new email address that the user wants to change to.
 */
@Entity
@Table(name = "email_change_tokens", indexes = {
    @Index(name = "idx_email_change_token", columnList = "token"),
    @Index(name = "idx_email_change_user", columnList = "user_id"),
    @Index(name = "idx_email_change_expires", columnList = "expiresAt")
})
public class EmailChangeToken {

    private static final int EXPIRATION_HOURS = 24;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 254)
    private String newEmail;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean used = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime usedAt;

    public EmailChangeToken() {
    }

    public EmailChangeToken(User user, String newEmail) {
        this.user = user;
        this.newEmail = newEmail;
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
     * Checks if the token is valid (not expired and not used).
     */
    public boolean isValid() {
        return !used && LocalDateTime.now(ZoneOffset.UTC).isBefore(expiresAt);
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

    public String getNewEmail() {
        return newEmail;
    }

    public void setNewEmail(String newEmail) {
        this.newEmail = newEmail;
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
}

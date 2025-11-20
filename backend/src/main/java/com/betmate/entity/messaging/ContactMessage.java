package com.betmate.entity.messaging;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.betmate.entity.user.User;

/**
 * ContactMessage entity representing a support/contact message from users.
 *
 * This entity stores messages submitted through the contact/support form.
 */
@Entity
@Table(name = "contact_messages", indexes = {
    @Index(name = "idx_contact_user", columnList = "user_id"),
    @Index(name = "idx_contact_created", columnList = "createdAt"),
    @Index(name = "idx_contact_status", columnList = "status"),
    @Index(name = "idx_contact_category", columnList = "category")
})
public class ContactMessage {

    // ==========================================
    // IDENTITY
    // ==========================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Optional - can be null for anonymous submissions

    // ==========================================
    // MESSAGE CONTENT
    // ==========================================

    @NotNull
    @Size(min = 3, max = 50)
    @Column(nullable = false, length = 50)
    private String category; // "General Support" or "Bug Report"

    @NotNull
    @Size(min = 3, max = 100)
    @Column(nullable = false, length = 100)
    private String subject;

    @NotNull
    @Size(min = 10, max = 500)
    @Column(nullable = false, length = 500)
    private String message;

    @Email
    @Size(max = 100)
    @Column(length = 100)
    private String email; // Optional email if user wants to be contacted differently

    // ==========================================
    // STATUS
    // ==========================================

    @NotNull
    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, RESOLVED, CLOSED

    // ==========================================
    // AUDIT FIELDS
    // ==========================================

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    // ==========================================
    // CONSTRUCTORS
    // ==========================================

    public ContactMessage() {}

    public ContactMessage(User user, String category, String subject, String message, String email) {
        this.user = user;
        this.category = category;
        this.subject = subject;
        this.message = message;
        this.email = email;
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

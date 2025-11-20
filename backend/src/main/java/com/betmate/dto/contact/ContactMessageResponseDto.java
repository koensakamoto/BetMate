package com.betmate.dto.contact;

import java.time.LocalDateTime;

/**
 * DTO for contact message responses.
 */
public class ContactMessageResponseDto {

    private Long id;
    private String category;
    private String subject;
    private String status;
    private LocalDateTime createdAt;

    // Constructors
    public ContactMessageResponseDto() {}

    public ContactMessageResponseDto(Long id, String category, String subject, String status, LocalDateTime createdAt) {
        this.id = id;
        this.category = category;
        this.subject = subject;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
}

package com.rivalpicks.dto.messaging.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for editing existing messages.
 * Contains validation for message edit operations.
 */
public class EditMessageRequestDto {
    
    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    private String content;

    // Default constructor
    public EditMessageRequestDto() {}

    // Constructor
    public EditMessageRequestDto(String content) {
        this.content = content;
    }

    // Getters and setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
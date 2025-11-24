package com.rivalpicks.dto.user.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for initiating email change.
 * Requires the new email address and current password for security.
 */
public record EmailChangeRequestDto(
    @NotBlank(message = "New email is required")
    @Email(message = "Invalid email format")
    String newEmail,

    @NotBlank(message = "Current password is required")
    String currentPassword
) {}

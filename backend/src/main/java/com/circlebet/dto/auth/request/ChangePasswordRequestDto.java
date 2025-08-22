package com.circlebet.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for changing user password.
 */
public record ChangePasswordRequestDto(
    @NotBlank(message = "Current password is required")
    String currentPassword,
    
    @NotBlank(message = "New password is required")
    String newPassword
) {}
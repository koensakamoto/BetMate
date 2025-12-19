package com.rivalpicks.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for creating a password for OAuth users.
 */
public record CreatePasswordRequestDto(
    @NotBlank(message = "New password is required")
    String newPassword
) {}

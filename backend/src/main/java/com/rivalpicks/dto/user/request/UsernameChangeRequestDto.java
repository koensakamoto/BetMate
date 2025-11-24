package com.rivalpicks.dto.user.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for changing username.
 */
public record UsernameChangeRequestDto(
    @NotBlank(message = "Username is required")
    @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$", message = "Username must be 3-50 characters and contain only letters, numbers, and underscores")
    String newUsername
) {}

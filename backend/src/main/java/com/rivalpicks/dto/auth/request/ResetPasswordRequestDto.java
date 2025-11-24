package com.rivalpicks.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for resetting password with a token.
 */
public record ResetPasswordRequestDto(
    @NotBlank(message = "Reset token is required")
    String token,

    @NotBlank(message = "New password is required")
    String newPassword
) {}

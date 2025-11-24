package com.rivalpicks.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for initiating forgot password flow.
 */
public record ForgotPasswordRequestDto(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email
) {}

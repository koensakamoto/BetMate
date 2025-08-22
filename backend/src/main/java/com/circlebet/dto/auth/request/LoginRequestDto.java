package com.circlebet.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for user login.
 * Supports login with username or email.
 */
public record LoginRequestDto(
    @NotBlank(message = "Username or email is required")
    String usernameOrEmail,
    
    @NotBlank(message = "Password is required")
    String password
) {}
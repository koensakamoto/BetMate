package com.betmate.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for refreshing JWT token.
 */
public record RefreshTokenRequestDto(
    @NotBlank(message = "Refresh token is required")
    String refreshToken
) {}
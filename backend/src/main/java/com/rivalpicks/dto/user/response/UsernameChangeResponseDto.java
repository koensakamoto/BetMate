package com.rivalpicks.dto.user.response;

/**
 * Response DTO for username change operation.
 * Includes new tokens since JWT contains username as subject.
 */
public record UsernameChangeResponseDto(
    boolean success,
    String message,
    String newUsername,
    String accessToken,
    String refreshToken
) {}

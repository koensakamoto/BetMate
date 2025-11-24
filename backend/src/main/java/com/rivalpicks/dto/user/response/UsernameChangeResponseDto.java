package com.rivalpicks.dto.user.response;

/**
 * Response DTO for username change operation.
 */
public record UsernameChangeResponseDto(
    boolean success,
    String message,
    String newUsername
) {}

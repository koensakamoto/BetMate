package com.rivalpicks.dto.user.response;

/**
 * Response DTO for email change operations.
 */
public record EmailChangeResponseDto(
    boolean success,
    String message,
    String email
) {}

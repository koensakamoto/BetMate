package com.circlebet.dto.user.response;

/**
 * Response DTO for username/email availability checks.
 */
public record UserAvailabilityResponseDto(
    boolean available,
    String message
) {}
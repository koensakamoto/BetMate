package com.rivalpicks.dto.user.response;

/**
 * Response DTO for username/email availability checks.
 */
public record UserAvailabilityResponseDto(
    boolean available,
    String message
) {}
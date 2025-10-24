package com.betmate.dto.user.request;

/**
 * Request DTO for updating user profile information.
 */
public record UserProfileUpdateRequestDto(
    String firstName,
    String lastName,
    String bio
) {}
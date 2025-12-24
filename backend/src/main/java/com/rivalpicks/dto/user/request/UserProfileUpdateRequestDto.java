package com.rivalpicks.dto.user.request;

import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating user profile information.
 */
public record UserProfileUpdateRequestDto(
    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    String firstName,

    @Size(min = 1, max = 50, message = "Last name must be between 1 and 50 characters")
    String lastName,

    @Size(max = 150, message = "Bio cannot exceed 150 characters")
    String bio
) {}
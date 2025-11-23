package com.rivalpicks.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for Apple Sign-In authentication.
 * Contains the Apple identity token and user information from Apple.
 *
 * Note: Apple only provides email and name on the FIRST sign-in.
 * Subsequent sign-ins will have null values for these fields.
 * The backend must store this info on first sign-in.
 */
public record AppleAuthRequestDto(
    @NotBlank(message = "Apple identity token is required")
    String identityToken,

    @NotBlank(message = "Apple user ID is required")
    String userId,

    String email,

    String firstName,

    String lastName
) {}

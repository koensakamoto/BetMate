package com.rivalpicks.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for Google OAuth login.
 * Contains the Google ID token and user information from Google.
 */
public record GoogleAuthRequestDto(
    @NotBlank(message = "Google ID token is required")
    String idToken,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    String firstName,

    String lastName,

    String profileImageUrl
) {}

package com.rivalpicks.dto.user.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for user registration.
 * Contains all required fields and validation for user registration.
 */
public record UserRegistrationRequestDto(
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$", message = "Username must be 3-50 characters, alphanumeric and underscore only")
    String username,

    @NotBlank
    @Email
    String email,

    @NotBlank
    String password,

    @Size(max = 50, message = "First name cannot exceed 50 characters")
    String firstName,

    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    String lastName
) {}
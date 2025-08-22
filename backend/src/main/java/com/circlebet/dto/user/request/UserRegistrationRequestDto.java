package com.circlebet.dto.user.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

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
    
    String firstName,
    String lastName
) {}
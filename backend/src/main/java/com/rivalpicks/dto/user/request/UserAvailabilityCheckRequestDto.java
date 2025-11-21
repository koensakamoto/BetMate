package com.rivalpicks.dto.user.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for checking username and email availability during registration.
 */
public record UserAvailabilityCheckRequestDto(
    @NotBlank 
    @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$")
    String username,
    
    @NotBlank 
    @Email
    String email
) {}
package com.rivalpicks.dto.user.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for confirming email change with verification token.
 */
public record EmailChangeConfirmRequestDto(
    @NotBlank(message = "Verification token is required")
    String token
) {}

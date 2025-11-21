package com.rivalpicks.dto.betting.request;

import jakarta.validation.constraints.*;

/**
 * Request DTO for cancelling a bet.
 * Only the bet creator can cancel a bet, and only if it's not yet resolved.
 */
public class CancelBetRequestDto {

    @Size(max = 500, message = "Cancellation reason cannot exceed 500 characters")
    private String reason;

    // Constructors
    public CancelBetRequestDto() {}

    public CancelBetRequestDto(String reason) {
        this.reason = reason;
    }

    // Getters and setters
    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

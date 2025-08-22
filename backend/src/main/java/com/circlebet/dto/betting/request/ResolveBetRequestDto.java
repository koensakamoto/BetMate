package com.circlebet.dto.betting.request;

import com.circlebet.entity.betting.Bet;
import jakarta.validation.constraints.*;

/**
 * Request DTO for resolving a bet.
 */
public class ResolveBetRequestDto {
    
    @NotNull(message = "Bet outcome is required")
    private Bet.BetOutcome outcome;
    
    @Size(max = 1000, message = "Resolution comment cannot exceed 1000 characters")
    private String resolutionComment;

    // Constructors
    public ResolveBetRequestDto() {}

    public ResolveBetRequestDto(Bet.BetOutcome outcome, String resolutionComment) {
        this.outcome = outcome;
        this.resolutionComment = resolutionComment;
    }

    // Getters and setters
    public Bet.BetOutcome getOutcome() {
        return outcome;
    }

    public void setOutcome(Bet.BetOutcome outcome) {
        this.outcome = outcome;
    }

    public String getResolutionComment() {
        return resolutionComment;
    }

    public void setResolutionComment(String resolutionComment) {
        this.resolutionComment = resolutionComment;
    }
}
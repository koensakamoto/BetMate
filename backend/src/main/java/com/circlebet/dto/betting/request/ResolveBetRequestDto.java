package com.circlebet.dto.betting.request;

import jakarta.validation.constraints.*;
import java.util.List;

/**
 * Request DTO for resolving a bet.
 * Supports two resolution modes:
 * 1. Option-based (BINARY/MULTIPLE_CHOICE): Use 'outcome' field
 * 2. Winner-based (PREDICTION): Use 'winnerUserIds' field
 */
public class ResolveBetRequestDto {

    // For option-based resolution (BINARY/MULTIPLE_CHOICE bets)
    private String outcome;

    // For winner-based resolution (PREDICTION bets)
    // List of user IDs who had correct predictions
    private List<Long> winnerUserIds;

    @Size(max = 1000, message = "Resolution comment cannot exceed 1000 characters")
    private String reasoning;

    // Constructors
    public ResolveBetRequestDto() {}

    public ResolveBetRequestDto(String outcome, String reasoning) {
        this.outcome = outcome;
        this.reasoning = reasoning;
    }

    public ResolveBetRequestDto(List<Long> winnerUserIds, String reasoning) {
        this.winnerUserIds = winnerUserIds;
        this.reasoning = reasoning;
    }

    // Getters and setters
    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public List<Long> getWinnerUserIds() {
        return winnerUserIds;
    }

    public void setWinnerUserIds(List<Long> winnerUserIds) {
        this.winnerUserIds = winnerUserIds;
    }

    public String getReasoning() {
        return reasoning;
    }

    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }

    /**
     * Validates that either outcome or winnerUserIds is provided (but not both).
     */
    public boolean isValid() {
        boolean hasOutcome = outcome != null && !outcome.trim().isEmpty();
        boolean hasWinners = winnerUserIds != null && !winnerUserIds.isEmpty();

        // Must have exactly one of: outcome or winnerUserIds
        return hasOutcome != hasWinners; // XOR logic
    }
}
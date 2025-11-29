package com.rivalpicks.dto.betting.request;

import jakarta.validation.constraints.*;
import java.util.List;

/**
 * Request DTO for voting on bet resolution (consensus voting).
 *
 * Supports two vote types:
 * 1. Outcome-based (BINARY/MULTIPLE_CHOICE): Use 'outcome' field
 * 2. Winner-based (PREDICTION): Use 'winnerUserIds' field
 */
public class VoteOnResolutionRequestDto {

    // For BINARY/MULTIPLE_CHOICE bets
    private String outcome;

    // For PREDICTION bets - list of user IDs selected as winners
    private List<Long> winnerUserIds;

    @Size(max = 1000, message = "Reasoning cannot exceed 1000 characters")
    private String reasoning;

    // Constructors
    public VoteOnResolutionRequestDto() {}

    public VoteOnResolutionRequestDto(String outcome, String reasoning) {
        this.outcome = outcome;
        this.reasoning = reasoning;
    }

    public VoteOnResolutionRequestDto(List<Long> winnerUserIds, String reasoning) {
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
     * Validates that either outcome or winnerUserIds is provided.
     */
    public boolean isValid() {
        boolean hasOutcome = outcome != null && !outcome.trim().isEmpty();
        boolean hasWinners = winnerUserIds != null && !winnerUserIds.isEmpty();
        return hasOutcome || hasWinners;
    }

    /**
     * Checks if this is a winner-based vote (for PREDICTION bets).
     */
    public boolean isWinnerBasedVote() {
        return winnerUserIds != null && !winnerUserIds.isEmpty();
    }
}
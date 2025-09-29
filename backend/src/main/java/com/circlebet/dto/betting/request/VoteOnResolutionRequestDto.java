package com.circlebet.dto.betting.request;

import jakarta.validation.constraints.*;

/**
 * Request DTO for voting on bet resolution (consensus voting).
 */
public class VoteOnResolutionRequestDto {

    @NotBlank(message = "Vote outcome is required")
    private String outcome;

    @NotBlank(message = "Reasoning is required for voting")
    @Size(max = 1000, message = "Reasoning cannot exceed 1000 characters")
    private String reasoning;

    // Constructors
    public VoteOnResolutionRequestDto() {}

    public VoteOnResolutionRequestDto(String outcome, String reasoning) {
        this.outcome = outcome;
        this.reasoning = reasoning;
    }

    // Getters and setters
    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getReasoning() {
        return reasoning;
    }

    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
}
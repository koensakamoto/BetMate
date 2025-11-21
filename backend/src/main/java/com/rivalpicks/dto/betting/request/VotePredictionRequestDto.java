package com.rivalpicks.dto.betting.request;

import jakarta.validation.constraints.NotNull;

/**
 * DTO for submitting a vote on a prediction bet participant's correctness.
 */
public class VotePredictionRequestDto {

    @NotNull(message = "Participation ID is required")
    private Long participationId;

    @NotNull(message = "isCorrect is required")
    private Boolean isCorrect;

    // Getters and setters
    public Long getParticipationId() {
        return participationId;
    }

    public void setParticipationId(Long participationId) {
        this.participationId = participationId;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
}

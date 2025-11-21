package com.rivalpicks.dto.betting.response;

import com.rivalpicks.entity.betting.BetParticipation;
import com.rivalpicks.entity.betting.Bet;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for bet participation information.
 * Used when resolvers need to see who participated and what they chose.
 */
public class BetParticipationResponseDto {

    private Long participationId;
    private Long userId;
    private String username;
    private String displayName;
    private String profileImageUrl;

    // For option-based bets (BINARY, MULTIPLE_CHOICE)
    private Integer chosenOption;
    private String chosenOptionText; // The actual text of the option

    // For prediction bets
    private String predictedValue;

    private BigDecimal betAmount;
    private BigDecimal potentialWinnings;
    private BetParticipation.ParticipationStatus status;
    private LocalDateTime createdAt;

    // Constructors
    public BetParticipationResponseDto() {}

    // Getters and setters
    public Long getParticipationId() {
        return participationId;
    }

    public void setParticipationId(Long participationId) {
        this.participationId = participationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public Integer getChosenOption() {
        return chosenOption;
    }

    public void setChosenOption(Integer chosenOption) {
        this.chosenOption = chosenOption;
    }

    public String getChosenOptionText() {
        return chosenOptionText;
    }

    public void setChosenOptionText(String chosenOptionText) {
        this.chosenOptionText = chosenOptionText;
    }

    public String getPredictedValue() {
        return predictedValue;
    }

    public void setPredictedValue(String predictedValue) {
        this.predictedValue = predictedValue;
    }

    public BigDecimal getBetAmount() {
        return betAmount;
    }

    public void setBetAmount(BigDecimal betAmount) {
        this.betAmount = betAmount;
    }

    public BigDecimal getPotentialWinnings() {
        return potentialWinnings;
    }

    public void setPotentialWinnings(BigDecimal potentialWinnings) {
        this.potentialWinnings = potentialWinnings;
    }

    public BetParticipation.ParticipationStatus getStatus() {
        return status;
    }

    public void setStatus(BetParticipation.ParticipationStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Helper method to convert from entity
    public static BetParticipationResponseDto fromParticipation(BetParticipation participation, Bet bet) {
        BetParticipationResponseDto dto = new BetParticipationResponseDto();

        dto.setParticipationId(participation.getId());
        dto.setUserId(participation.getUser().getId());
        dto.setUsername(participation.getUser().getUsername());
        dto.setDisplayName(participation.getUser().getDisplayName());
        // User entity doesn't have profileImageUrl yet
        dto.setProfileImageUrl(null);

        dto.setChosenOption(participation.getChosenOption());

        // Map chosen option number to actual option text
        if (participation.getChosenOption() != null && bet != null) {
            String optionText = switch (participation.getChosenOption()) {
                case 1 -> bet.getOption1();
                case 2 -> bet.getOption2();
                case 3 -> bet.getOption3();
                case 4 -> bet.getOption4();
                default -> null;
            };
            dto.setChosenOptionText(optionText);
        }

        dto.setBetAmount(participation.getBetAmount());
        dto.setPotentialWinnings(participation.getPotentialWinnings());
        dto.setStatus(participation.getStatus());
        dto.setCreatedAt(participation.getCreatedAt());

        return dto;
    }
}

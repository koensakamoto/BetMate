package com.rivalpicks.dto.betting.response;

import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.betting.BetParticipation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for bets that can have inventory items applied to them.
 * Used when displaying eligible bets for applying insurance, mulligan tokens, etc.
 */
public class EligibleBetResponseDto {

    private Long betId;
    private Long participationId;
    private String title;
    private String groupName;
    private BigDecimal betAmount;
    private Integer chosenOption;
    private String chosenOptionText;
    private String predictedValue;
    private BigDecimal potentialWinnings;
    private LocalDateTime deadline;
    private Bet.BetStatus betStatus;
    private boolean canApply;
    private String reason; // Reason if item cannot be applied

    // Constructors
    public EligibleBetResponseDto() {}

    public EligibleBetResponseDto(Long betId, Long participationId, String title, String groupName,
                                 BigDecimal betAmount, Integer chosenOption, String chosenOptionText,
                                 String predictedValue, BigDecimal potentialWinnings,
                                 LocalDateTime deadline, Bet.BetStatus betStatus,
                                 boolean canApply, String reason) {
        this.betId = betId;
        this.participationId = participationId;
        this.title = title;
        this.groupName = groupName;
        this.betAmount = betAmount;
        this.chosenOption = chosenOption;
        this.chosenOptionText = chosenOptionText;
        this.predictedValue = predictedValue;
        this.potentialWinnings = potentialWinnings;
        this.deadline = deadline;
        this.betStatus = betStatus;
        this.canApply = canApply;
        this.reason = reason;
    }

    // Getters and setters
    public Long getBetId() {
        return betId;
    }

    public void setBetId(Long betId) {
        this.betId = betId;
    }

    public Long getParticipationId() {
        return participationId;
    }

    public void setParticipationId(Long participationId) {
        this.participationId = participationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public BigDecimal getBetAmount() {
        return betAmount;
    }

    public void setBetAmount(BigDecimal betAmount) {
        this.betAmount = betAmount;
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

    public BigDecimal getPotentialWinnings() {
        return potentialWinnings;
    }

    public void setPotentialWinnings(BigDecimal potentialWinnings) {
        this.potentialWinnings = potentialWinnings;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public Bet.BetStatus getBetStatus() {
        return betStatus;
    }

    public void setBetStatus(Bet.BetStatus betStatus) {
        this.betStatus = betStatus;
    }

    public boolean isCanApply() {
        return canApply;
    }

    public void setCanApply(boolean canApply) {
        this.canApply = canApply;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    /**
     * Helper method to convert from BetParticipation entity.
     *
     * @param participation The bet participation entity
     * @param canApply Whether the item can be applied to this bet
     * @param reason Reason if item cannot be applied (null if canApply is true)
     * @return The DTO representation
     */
    public static EligibleBetResponseDto fromParticipation(BetParticipation participation,
                                                          boolean canApply,
                                                          String reason) {
        EligibleBetResponseDto dto = new EligibleBetResponseDto();
        Bet bet = participation.getBet();

        dto.setBetId(bet.getId());
        dto.setParticipationId(participation.getId());
        dto.setTitle(bet.getTitle());
        dto.setGroupName(bet.getGroup().getName());
        dto.setBetAmount(participation.getBetAmount());
        dto.setChosenOption(participation.getChosenOption());

        // Get chosen option text based on bet type and option number
        if (participation.getChosenOption() != null) {
            dto.setChosenOptionText(getOptionText(bet, participation.getChosenOption()));
        }

        // Predicted value would be stored in BetPrediction entity if this is a prediction bet
        // For now, leave it null for non-prediction bets
        dto.setPredictedValue(null); // TODO: Fetch from BetPrediction if needed
        dto.setPotentialWinnings(participation.getPotentialWinnings());
        dto.setDeadline(bet.getBettingDeadline());
        dto.setBetStatus(bet.getStatus());
        dto.setCanApply(canApply);
        dto.setReason(reason);

        return dto;
    }

    /**
     * Helper method to get option text based on bet type and option number.
     */
    private static String getOptionText(Bet bet, Integer optionNumber) {
        if (optionNumber == null) {
            return null;
        }

        return switch (optionNumber) {
            case 1 -> bet.getOption1();
            case 2 -> bet.getOption2();
            case 3 -> bet.getOption3();
            case 4 -> bet.getOption4();
            default -> null;
        };
    }
}

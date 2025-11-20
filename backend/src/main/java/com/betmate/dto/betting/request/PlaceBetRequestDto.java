package com.betmate.dto.betting.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Request DTO for placing a bet.
 */
public class PlaceBetRequestDto {

    // For non-prediction bets (BINARY, MULTIPLE_CHOICE)
    @Min(value = 1, message = "Chosen option must be between 1 and 4")
    @Max(value = 4, message = "Chosen option must be between 1 and 4")
    private Integer chosenOption;

    @NotNull(message = "Bet amount is required")
    @DecimalMin(value = "0.00", message = "Bet amount cannot be negative")
    private BigDecimal amount;

    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String comment;

    @Size(max = 500, message = "Predicted value cannot exceed 500 characters")
    private String predictedValue;

    @Min(value = 1, message = "Insurance item ID must be positive")
    private Long insuranceItemId;

    // Constructors
    public PlaceBetRequestDto() {}

    public PlaceBetRequestDto(Integer chosenOption, BigDecimal amount, String comment) {
        this.chosenOption = chosenOption;
        this.amount = amount;
        this.comment = comment;
    }

    public PlaceBetRequestDto(BigDecimal amount, String predictedValue, String comment) {
        this.amount = amount;
        this.predictedValue = predictedValue;
        this.comment = comment;
    }

    // Getters and setters
    public Integer getChosenOption() {
        return chosenOption;
    }

    public void setChosenOption(Integer chosenOption) {
        this.chosenOption = chosenOption;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getPredictedValue() {
        return predictedValue;
    }

    public void setPredictedValue(String predictedValue) {
        this.predictedValue = predictedValue;
    }

    public Long getInsuranceItemId() {
        return insuranceItemId;
    }

    public void setInsuranceItemId(Long insuranceItemId) {
        this.insuranceItemId = insuranceItemId;
    }
}
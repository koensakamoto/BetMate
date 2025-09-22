package com.circlebet.dto.betting.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Request DTO for placing a bet.
 */
public class PlaceBetRequestDto {

    @NotNull(message = "Chosen option is required")
    @Min(value = 1, message = "Chosen option must be between 1 and 4")
    @Max(value = 4, message = "Chosen option must be between 1 and 4")
    private Integer chosenOption;

    @NotNull(message = "Bet amount is required")
    @DecimalMin(value = "0.01", message = "Bet amount must be at least 0.01")
    private BigDecimal amount;

    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String comment;

    // Constructors
    public PlaceBetRequestDto() {}

    public PlaceBetRequestDto(Integer chosenOption, BigDecimal amount, String comment) {
        this.chosenOption = chosenOption;
        this.amount = amount;
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
}
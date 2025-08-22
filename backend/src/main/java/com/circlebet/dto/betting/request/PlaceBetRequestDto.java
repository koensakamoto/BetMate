package com.circlebet.dto.betting.request;

import com.circlebet.entity.betting.Bet;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Request DTO for placing a bet.
 */
public class PlaceBetRequestDto {
    
    @NotNull(message = "Bet outcome choice is required")
    private Bet.BetOutcome choice;
    
    @NotNull(message = "Bet amount is required")
    @DecimalMin(value = "0.01", message = "Bet amount must be at least 0.01")
    private BigDecimal amount;
    
    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String comment;

    // Constructors
    public PlaceBetRequestDto() {}

    public PlaceBetRequestDto(Bet.BetOutcome choice, BigDecimal amount, String comment) {
        this.choice = choice;
        this.amount = amount;
        this.comment = comment;
    }

    // Getters and setters
    public Bet.BetOutcome getChoice() {
        return choice;
    }

    public void setChoice(Bet.BetOutcome choice) {
        this.choice = choice;
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
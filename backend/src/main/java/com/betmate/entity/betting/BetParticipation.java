package com.betmate.entity.betting;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.betmate.entity.user.User;
import com.betmate.entity.user.UserInventory;

/**
 * BetParticipation entity representing a user's participation in a specific bet.
 * 
 * This entity tracks individual user bets within group betting activities,
 * including bet amounts, chosen options, and outcomes.
 */
@Entity
@Table(name = "bet_participations", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "bet_id"}),
    indexes = {
        @Index(name = "idx_participation_user", columnList = "user_id"),
        @Index(name = "idx_participation_bet", columnList = "bet_id"),
        @Index(name = "idx_participation_option", columnList = "chosenOption"),
        @Index(name = "idx_participation_status", columnList = "status"),
        @Index(name = "idx_participation_created", columnList = "createdAt"),
        @Index(name = "idx_participation_composite", columnList = "bet_id, chosenOption, status")
    }
)
public class BetParticipation {
    
    // ==========================================
    // IDENTITY
    // ==========================================
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // RELATIONSHIPS
    // ==========================================
    
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "bet_id")
    private Bet bet;

    // ==========================================
    // PARTICIPATION DETAILS
    // ==========================================
    
    @Column(nullable = false)
    @Min(value = 1, message = "Chosen option must be between 1 and 4")
    @Max(value = 4, message = "Chosen option must be between 1 and 4")
    private Integer chosenOption;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal betAmount;

    @Column(precision = 19, scale = 2)
    private BigDecimal potentialWinnings;

    @Column(precision = 19, scale = 2)
    private BigDecimal actualWinnings = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipationStatus status = ParticipationStatus.ACTIVE;

    @Column(nullable = false)
    private Boolean isActive = true;

    // ==========================================
    // INSURANCE DETAILS
    // ==========================================

    @ManyToOne
    @JoinColumn(name = "insurance_item_id")
    private UserInventory insuranceItem;

    @Column
    private Integer insuranceRefundPercentage;

    @Column(precision = 19, scale = 2)
    private BigDecimal insuranceRefundAmount;

    @Column(nullable = false)
    private Boolean insuranceApplied = false;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime settledAt;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================
    
    // Identity
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }

    // Relationships
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }

    public Bet getBet() {
        return bet;
    }
    
    public void setBet(Bet bet) {
        this.bet = bet;
    }

    // Participation Details
    public Integer getChosenOption() {
        return chosenOption;
    }
    
    public void setChosenOption(Integer chosenOption) {
        this.chosenOption = chosenOption;
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

    public BigDecimal getActualWinnings() {
        return actualWinnings;
    }
    
    public void setActualWinnings(BigDecimal actualWinnings) {
        this.actualWinnings = actualWinnings;
    }

    public ParticipationStatus getStatus() {
        return status;
    }
    
    public void setStatus(ParticipationStatus status) {
        this.status = status;
    }

    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    // Insurance Details
    public UserInventory getInsuranceItem() {
        return insuranceItem;
    }

    public void setInsuranceItem(UserInventory insuranceItem) {
        this.insuranceItem = insuranceItem;
    }

    public Integer getInsuranceRefundPercentage() {
        return insuranceRefundPercentage;
    }

    public void setInsuranceRefundPercentage(Integer insuranceRefundPercentage) {
        this.insuranceRefundPercentage = insuranceRefundPercentage;
    }

    public BigDecimal getInsuranceRefundAmount() {
        return insuranceRefundAmount;
    }

    public void setInsuranceRefundAmount(BigDecimal insuranceRefundAmount) {
        this.insuranceRefundAmount = insuranceRefundAmount;
    }

    public Boolean getInsuranceApplied() {
        return insuranceApplied;
    }

    public void setInsuranceApplied(Boolean insuranceApplied) {
        this.insuranceApplied = insuranceApplied;
    }

    // System Fields
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getSettledAt() {
        return settledAt;
    }
    
    public void setSettledAt(LocalDateTime settledAt) {
        this.settledAt = settledAt;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if this participation is a winning bet.
     * 
     * @return true if the chosen option matches the bet outcome
     */
    public boolean isWinner() {
        if (bet == null || bet.getOutcome() == null) {
            return false;
        }

        return switch (bet.getOutcome()) {
            case OPTION_1 -> chosenOption == 1;
            case OPTION_2 -> chosenOption == 2;
            case OPTION_3 -> chosenOption == 3;
            case OPTION_4 -> chosenOption == 4;
            default -> false;
        };
    }

    /**
     * Checks if this participation has been settled.
     * 
     * @return true if participation has been processed after bet resolution
     */
    public boolean isSettled() {
        return settledAt != null;
    }

    /**
     * Settles the participation by calculating and setting actual winnings.
     * 
     * @param winnings the amount won (should be BigDecimal.ZERO for losses)
     */
    public void settle(BigDecimal winnings) {
        this.actualWinnings = winnings != null ? winnings : BigDecimal.ZERO;
        this.settledAt = LocalDateTime.now();
        
        if (isWinner() && winnings != null && winnings.compareTo(BigDecimal.ZERO) > 0) {
            this.status = ParticipationStatus.WON;
        } else {
            this.status = ParticipationStatus.LOST;
        }
    }

    /**
     * Refunds the participation (used when bet is cancelled).
     */
    public void refund() {
        this.actualWinnings = this.betAmount;
        this.status = ParticipationStatus.REFUNDED;
        this.settledAt = LocalDateTime.now();
    }

    /**
     * Calculates the potential return on investment ratio.
     * 
     * @return ROI ratio, or 0.0 if bet amount is zero
     */
    public double getPotentialROI() {
        if (betAmount.compareTo(BigDecimal.ZERO) == 0 || potentialWinnings == null) {
            return 0.0;
        }
        return potentialWinnings.divide(betAmount, 4, java.math.RoundingMode.HALF_UP).doubleValue() - 1.0;
    }

    /**
     * Calculates the actual return on investment ratio.
     * 
     * @return actual ROI ratio, or 0.0 if not settled or bet amount is zero
     */
    public double getActualROI() {
        if (!isSettled() || betAmount.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return actualWinnings.divide(betAmount, 4, java.math.RoundingMode.HALF_UP).doubleValue() - 1.0;
    }

    /**
     * Gets the profit/loss amount (actual winnings minus bet amount).
     * 
     * @return profit if positive, loss if negative
     */
    public BigDecimal getProfitLoss() {
        return actualWinnings.subtract(betAmount);
    }

    /**
     * Calculates potential winnings based on current odds and bet amount.
     * This should be called when the bet is placed or when odds change.
     * 
     * @param odds the current odds for the chosen option
     */
    public void calculatePotentialWinnings(double odds) {
        if (odds > 0) {
            this.potentialWinnings = betAmount.multiply(BigDecimal.valueOf(odds));
        } else {
            this.potentialWinnings = betAmount;
        }
    }

    /**
     * Checks if the participation is valid for the current bet state.
     *
     * @return true if participation is valid
     */
    public boolean isValid() {
        return isActive &&
               status == ParticipationStatus.ACTIVE &&
               betAmount != null &&
               betAmount.compareTo(BigDecimal.ZERO) > 0 &&
               chosenOption != null &&
               chosenOption >= 1 &&
               chosenOption <= 4;
    }

    /**
     * Gets the user ID associated with this participation.
     *
     * @return user ID
     */
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    /**
     * Gets the user's prediction (chosen option).
     *
     * @return chosen option as prediction
     */
    public Integer getPrediction() {
        return chosenOption;
    }

    /**
     * Checks if insurance is applied to this participation.
     *
     * @return true if insurance is applied
     */
    public boolean hasInsurance() {
        return insuranceApplied != null && insuranceApplied && insuranceItem != null;
    }

    /**
     * Applies insurance to this participation.
     *
     * @param insurance the insurance item to apply
     * @param refundPercentage the refund percentage (25, 50, or 75)
     */
    public void applyInsurance(UserInventory insurance, Integer refundPercentage) {
        this.insuranceItem = insurance;
        this.insuranceRefundPercentage = refundPercentage;
        this.insuranceApplied = true;
        // Calculate refund amount
        this.insuranceRefundAmount = betAmount.multiply(BigDecimal.valueOf(refundPercentage))
                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Removes insurance from this participation (used when bet is cancelled).
     */
    public void removeInsurance() {
        this.insuranceItem = null;
        this.insuranceRefundPercentage = null;
        this.insuranceRefundAmount = null;
        this.insuranceApplied = false;
    }

    /**
     * Checks if this participation qualifies for insurance refund.
     * Only lost bets with insurance applied get refunded.
     *
     * @return true if should receive insurance refund
     */
    public boolean shouldReceiveInsuranceRefund() {
        return hasInsurance() &&
               !isWinner() &&
               status == ParticipationStatus.LOST &&
               insuranceRefundAmount != null &&
               insuranceRefundAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Status of a user's participation in a bet.
     */
    public enum ParticipationStatus {
        CREATOR,    // User created the bet (tracking only, no money involved)
        ACTIVE,     // Bet is placed and active
        WON,        // Participation won
        LOST,       // Participation lost
        REFUNDED,   // Bet was cancelled and amount refunded
        CANCELLED   // Participation was cancelled by user (if allowed)
    }
}
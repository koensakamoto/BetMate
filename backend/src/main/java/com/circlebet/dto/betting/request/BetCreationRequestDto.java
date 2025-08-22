package com.circlebet.dto.betting.request;

import com.circlebet.entity.betting.Bet;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Request DTO for creating a new bet.
 */
public class BetCreationRequestDto {
    
    @NotNull(message = "Group ID is required")
    private Long groupId;
    
    @NotBlank(message = "Bet title is required")
    @Size(min = 10, max = 200, message = "Bet title must be between 10 and 200 characters")
    private String title;
    
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;
    
    @NotNull(message = "Bet type is required")
    private Bet.BetType betType;
    
    @NotNull(message = "Resolution method is required")
    private Bet.BetResolutionMethod resolutionMethod;
    
    @NotNull(message = "Betting deadline is required")
    @Future(message = "Betting deadline must be in the future")
    private LocalDateTime bettingDeadline;
    
    @NotNull(message = "Resolve date is required")
    @Future(message = "Resolve date must be in the future")
    private LocalDateTime resolveDate;
    
    @NotNull(message = "Minimum bet amount is required")
    @DecimalMin(value = "0.01", message = "Minimum bet amount must be at least 0.01")
    private BigDecimal minimumBet;
    
    @DecimalMin(value = "0.01", message = "Maximum bet amount must be at least 0.01")
    private BigDecimal maximumBet;
    
    @Min(value = 1, message = "Minimum votes required must be at least 1")
    private Integer minimumVotesRequired;
    
    private Boolean allowCreatorVote = true;
    
    // For multiple choice bets
    @Size(max = 4, message = "Maximum 4 options allowed")
    private String[] options;

    // Constructors
    public BetCreationRequestDto() {}

    // Getters and setters
    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Bet.BetType getBetType() {
        return betType;
    }

    public void setBetType(Bet.BetType betType) {
        this.betType = betType;
    }

    public Bet.BetResolutionMethod getResolutionMethod() {
        return resolutionMethod;
    }

    public void setResolutionMethod(Bet.BetResolutionMethod resolutionMethod) {
        this.resolutionMethod = resolutionMethod;
    }

    public LocalDateTime getBettingDeadline() {
        return bettingDeadline;
    }

    public void setBettingDeadline(LocalDateTime bettingDeadline) {
        this.bettingDeadline = bettingDeadline;
    }

    public LocalDateTime getResolveDate() {
        return resolveDate;
    }

    public void setResolveDate(LocalDateTime resolveDate) {
        this.resolveDate = resolveDate;
    }

    public BigDecimal getMinimumBet() {
        return minimumBet;
    }

    public void setMinimumBet(BigDecimal minimumBet) {
        this.minimumBet = minimumBet;
    }

    public BigDecimal getMaximumBet() {
        return maximumBet;
    }

    public void setMaximumBet(BigDecimal maximumBet) {
        this.maximumBet = maximumBet;
    }

    public Integer getMinimumVotesRequired() {
        return minimumVotesRequired;
    }

    public void setMinimumVotesRequired(Integer minimumVotesRequired) {
        this.minimumVotesRequired = minimumVotesRequired;
    }

    public Boolean getAllowCreatorVote() {
        return allowCreatorVote;
    }

    public void setAllowCreatorVote(Boolean allowCreatorVote) {
        this.allowCreatorVote = allowCreatorVote;
    }

    public String[] getOptions() {
        return options;
    }

    public void setOptions(String[] options) {
        this.options = options;
    }
}
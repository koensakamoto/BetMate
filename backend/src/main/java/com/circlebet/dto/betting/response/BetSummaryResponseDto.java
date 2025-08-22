package com.circlebet.dto.betting.response;

import com.circlebet.entity.betting.Bet;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Lightweight response DTO for bet summary information.
 * Used in lists and search results.
 */
public class BetSummaryResponseDto {
    
    private Long id;
    private String title;
    private Bet.BetType betType;
    private Bet.BetStatus status;
    private Bet.BetOutcome outcome;
    
    private String creatorUsername;
    private Long groupId;
    private String groupName;
    
    private LocalDateTime bettingDeadline;
    private LocalDateTime resolveDate;
    
    private BigDecimal totalPool;
    private Integer totalParticipants;
    
    private LocalDateTime createdAt;
    
    // User context
    private Boolean hasUserParticipated;
    private Bet.BetOutcome userChoice;

    // Constructors
    public BetSummaryResponseDto() {}

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Bet.BetType getBetType() {
        return betType;
    }

    public void setBetType(Bet.BetType betType) {
        this.betType = betType;
    }

    public Bet.BetStatus getStatus() {
        return status;
    }

    public void setStatus(Bet.BetStatus status) {
        this.status = status;
    }

    public Bet.BetOutcome getOutcome() {
        return outcome;
    }

    public void setOutcome(Bet.BetOutcome outcome) {
        this.outcome = outcome;
    }

    public String getCreatorUsername() {
        return creatorUsername;
    }

    public void setCreatorUsername(String creatorUsername) {
        this.creatorUsername = creatorUsername;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
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

    public BigDecimal getTotalPool() {
        return totalPool;
    }

    public void setTotalPool(BigDecimal totalPool) {
        this.totalPool = totalPool;
    }

    public Integer getTotalParticipants() {
        return totalParticipants;
    }

    public void setTotalParticipants(Integer totalParticipants) {
        this.totalParticipants = totalParticipants;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getHasUserParticipated() {
        return hasUserParticipated;
    }

    public void setHasUserParticipated(Boolean hasUserParticipated) {
        this.hasUserParticipated = hasUserParticipated;
    }

    public Bet.BetOutcome getUserChoice() {
        return userChoice;
    }

    public void setUserChoice(Bet.BetOutcome userChoice) {
        this.userChoice = userChoice;
    }
}
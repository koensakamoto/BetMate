package com.betmate.dto.betting.response;

import com.betmate.dto.user.response.UserProfileResponseDto;
import com.betmate.entity.betting.Bet;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for bet information.
 */
public class BetResponseDto {
    
    private Long id;
    private String title;
    private String description;
    private Bet.BetType betType;
    private Bet.BetStatus status;
    private Bet.BetOutcome outcome;
    private Bet.BetResolutionMethod resolutionMethod;
    
    private UserProfileResponseDto creator;
    private Long groupId;
    private String groupName;
    
    private LocalDateTime bettingDeadline;
    private LocalDateTime resolveDate;
    private LocalDateTime resolvedAt;
    
    private BigDecimal minimumBet;
    private BigDecimal maximumBet;
    private BigDecimal totalPool;
    private Integer totalParticipants;
    
    private Integer minimumVotesRequired;
    private Boolean allowCreatorVote;
    
    private String[] options;
    private String resolutionComment;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // User context
    private Boolean hasUserParticipated;
    private Bet.BetOutcome userChoice;
    private BigDecimal userAmount;
    private Boolean canUserResolve;

    // Constructors
    public BetResponseDto() {}

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

    public Bet.BetResolutionMethod getResolutionMethod() {
        return resolutionMethod;
    }

    public void setResolutionMethod(Bet.BetResolutionMethod resolutionMethod) {
        this.resolutionMethod = resolutionMethod;
    }

    public UserProfileResponseDto getCreator() {
        return creator;
    }

    public void setCreator(UserProfileResponseDto creator) {
        this.creator = creator;
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

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
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

    public String getResolutionComment() {
        return resolutionComment;
    }

    public void setResolutionComment(String resolutionComment) {
        this.resolutionComment = resolutionComment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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

    public BigDecimal getUserAmount() {
        return userAmount;
    }

    public void setUserAmount(BigDecimal userAmount) {
        this.userAmount = userAmount;
    }

    public Boolean getCanUserResolve() {
        return canUserResolve;
    }

    public void setCanUserResolve(Boolean canUserResolve) {
        this.canUserResolve = canUserResolve;
    }
}
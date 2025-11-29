package com.rivalpicks.dto.betting.response;

import com.rivalpicks.dto.group.response.MemberPreviewDto;
import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.betting.BetParticipation;
import com.rivalpicks.entity.betting.BetStakeType;
import com.rivalpicks.entity.betting.FulfillmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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

    // Stake information
    private BetStakeType stakeType;
    private BigDecimal fixedStakeAmount;
    private String socialStakeDescription;
    private FulfillmentStatus fulfillmentStatus;

    // User context
    private Boolean hasUserParticipated;
    private Bet.BetOutcome userChoice;
    private BigDecimal userAmount;
    private BetParticipation.ParticipationStatus userParticipationStatus;

    // Participant previews for displaying avatars
    private List<MemberPreviewDto> participantPreviews;

    // Insurance information (for user's participation)
    private Boolean hasInsurance;
    private Integer insuranceRefundPercentage;

    // Fulfillment claim status for current user (losers only)
    private Boolean hasCurrentUserClaimedFulfillment;

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

    public BigDecimal getUserAmount() {
        return userAmount;
    }

    public void setUserAmount(BigDecimal userAmount) {
        this.userAmount = userAmount;
    }

    public BetParticipation.ParticipationStatus getUserParticipationStatus() {
        return userParticipationStatus;
    }

    public void setUserParticipationStatus(BetParticipation.ParticipationStatus userParticipationStatus) {
        this.userParticipationStatus = userParticipationStatus;
    }

    public List<MemberPreviewDto> getParticipantPreviews() {
        return participantPreviews;
    }

    public void setParticipantPreviews(List<MemberPreviewDto> participantPreviews) {
        this.participantPreviews = participantPreviews;
    }

    public BetStakeType getStakeType() {
        return stakeType;
    }

    public void setStakeType(BetStakeType stakeType) {
        this.stakeType = stakeType;
    }

    public BigDecimal getFixedStakeAmount() {
        return fixedStakeAmount;
    }

    public void setFixedStakeAmount(BigDecimal fixedStakeAmount) {
        this.fixedStakeAmount = fixedStakeAmount;
    }

    public String getSocialStakeDescription() {
        return socialStakeDescription;
    }

    public void setSocialStakeDescription(String socialStakeDescription) {
        this.socialStakeDescription = socialStakeDescription;
    }

    public FulfillmentStatus getFulfillmentStatus() {
        return fulfillmentStatus;
    }

    public void setFulfillmentStatus(FulfillmentStatus fulfillmentStatus) {
        this.fulfillmentStatus = fulfillmentStatus;
    }

    public Boolean getHasInsurance() {
        return hasInsurance;
    }

    public void setHasInsurance(Boolean hasInsurance) {
        this.hasInsurance = hasInsurance;
    }

    public Integer getInsuranceRefundPercentage() {
        return insuranceRefundPercentage;
    }

    public void setInsuranceRefundPercentage(Integer insuranceRefundPercentage) {
        this.insuranceRefundPercentage = insuranceRefundPercentage;
    }

    public Boolean getHasCurrentUserClaimedFulfillment() {
        return hasCurrentUserClaimedFulfillment;
    }

    public void setHasCurrentUserClaimedFulfillment(Boolean hasCurrentUserClaimedFulfillment) {
        this.hasCurrentUserClaimedFulfillment = hasCurrentUserClaimedFulfillment;
    }
}
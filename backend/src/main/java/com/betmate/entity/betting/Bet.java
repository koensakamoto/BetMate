package com.betmate.entity.betting;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.betmate.entity.user.User;
import com.betmate.entity.group.Group;

/**
 * Bet entity representing betting activities within groups in the CircleBet platform.
 * 
 * This entity handles individual bets placed by users within groups, including
 * bet details, outcomes, and participant tracking.
 */
@Entity
@Table(name = "bets", indexes = {
    @Index(name = "idx_bet_creator", columnList = "creator_id"),
    @Index(name = "idx_bet_group", columnList = "group_id"),
    @Index(name = "idx_bet_status", columnList = "status"),
    @Index(name = "idx_bet_outcome", columnList = "outcome"),
    @Index(name = "idx_bet_created_at", columnList = "createdAt"),
    @Index(name = "idx_bet_resolve_date", columnList = "resolveDate"),
    @Index(name = "idx_bet_active", columnList = "isActive"),
    @Index(name = "idx_bet_group_status", columnList = "group_id, status")
})
public class Bet {
    
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
    @JoinColumn(name = "creator_id")
    private User creator;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private Group group;

    // ==========================================
    // BET DETAILS
    // ==========================================
    
    @Column(nullable = false, length = 200)
    @Size(min = 3, max = 200, message = "Bet title must be between 3 and 200 characters")
    private String title;

    @Column(length = 2000)
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BetType betType = BetType.MULTIPLE_CHOICE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BetStatus status = BetStatus.OPEN;

    @Enumerated(EnumType.STRING)
    private BetOutcome outcome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BetResolutionMethod resolutionMethod = BetResolutionMethod.CREATOR_ONLY;

    @Column(nullable = false)
    private Integer minimumVotesRequired = 1; // For consensus voting

    @Column(nullable = false)
    private Boolean allowCreatorVote = true; // Whether creator can vote in consensus

    // ==========================================
    // BETTING MECHANICS
    // ==========================================
    
    // DEPRECATED: For backward compatibility with variable-stake bets
    // New bets should use fixedStakeAmount instead
    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.01", message = "Minimum bet amount is 0.01")
    private BigDecimal minimumBet = new BigDecimal("1.00");

    // DEPRECATED: For backward compatibility with variable-stake bets
    @Column(precision = 19, scale = 2)
    private BigDecimal maximumBet;

    // NEW: Fixed stake amount for new bets (everyone bets exactly this amount)
    // Nullable for backward compatibility, will be required for CREDIT type bets
    @Column(precision = 19, scale = 2)
    @DecimalMin(value = "0.01", message = "Fixed stake amount must be at least 0.01")
    private BigDecimal fixedStakeAmount;

    // ==========================================
    // STAKE TYPE & SOCIAL BETTING
    // ==========================================

    /**
     * Type of stake for this bet
     * CREDIT: Uses in-game credits (requires fixedStakeAmount)
     * SOCIAL: Fun/social stakes with no credits (requires socialStakeDescription)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BetStakeType stakeType = BetStakeType.CREDIT; // Default to CREDIT for backward compatibility

    /**
     * Description of the social stake (e.g., "Loser buys pizza")
     * Required when stakeType = SOCIAL
     */
    @Column(length = 500)
    @Size(max = 500, message = "Social stake description cannot exceed 500 characters")
    private String socialStakeDescription;

    /**
     * Structured template data for social stakes (JSON format)
     * For future template-based stake creation
     */
    @Column(columnDefinition = "TEXT")
    private String socialStakeTemplate;

    /**
     * Whether fulfillment of the social stake should be tracked
     * Auto-set to true for all SOCIAL bets
     */
    @Column(nullable = false)
    private Boolean stakeFulfillmentRequired = false;

    /**
     * Current fulfillment status tracking
     * PENDING: No winners have confirmed
     * PARTIALLY_FULFILLED: Some winners have confirmed
     * FULFILLED: All winners have confirmed
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private FulfillmentStatus fulfillmentStatus = FulfillmentStatus.PENDING;

    /**
     * When loser(s) claimed they fulfilled the stake (optional)
     * Losers can optionally mark when they've completed the stake
     */
    @Column
    private LocalDateTime loserClaimedFulfilledAt;

    /**
     * Optional photo proof URL from loser
     * Path to image uploaded as proof of fulfillment
     */
    @Column(length = 500)
    private String loserFulfillmentProofUrl;

    /**
     * Optional text description from loser explaining the proof
     */
    @Column(columnDefinition = "TEXT")
    private String loserFulfillmentProofDescription;

    /**
     * When ALL winners confirmed receipt of their stakes
     * Bet is fully settled when this is set
     * Renamed from stakeFulfilledAt for clarity
     */
    @Column
    private LocalDateTime allWinnersConfirmedAt;

    // ==========================================
    // POOL TRACKING
    // ==========================================

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalPool = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer totalParticipants = 0;

    @Column(nullable = false)
    private Integer participantsForOption1 = 0;

    @Column(nullable = false)
    private Integer participantsForOption2 = 0;

    @Column(precision = 19, scale = 2)
    private BigDecimal poolForOption1 = BigDecimal.ZERO;

    @Column(precision = 19, scale = 2)
    private BigDecimal poolForOption2 = BigDecimal.ZERO;

    // ==========================================
    // BET OPTIONS
    // ==========================================
    
    @Column(nullable = false, length = 100)
    @Size(min = 1, max = 100, message = "Option 1 must be between 1 and 100 characters")
    private String option1 = "Yes";

    @Column(nullable = false, length = 100)
    @Size(min = 1, max = 100, message = "Option 2 must be between 1 and 100 characters")
    private String option2 = "No";

    @Column(length = 100)
    @Size(max = 100, message = "Option 3 cannot exceed 100 characters")
    private String option3;

    @Column(length = 100)
    @Size(max = 100, message = "Option 4 cannot exceed 100 characters")
    private String option4;

    // ==========================================
    // TIME MANAGEMENT
    // ==========================================
    
    @Column(nullable = false)
    private LocalDateTime bettingDeadline;

    @Column
    private LocalDateTime resolveDate;

    @Column
    private LocalDateTime resolvedAt;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==========================================
    // RELATIONSHIPS - COLLECTIONS
    // ==========================================
    
    @OneToMany(mappedBy = "bet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BetParticipation> participations;

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
    public User getCreator() {
        return creator;
    }
    
    public void setCreator(User creator) {
        this.creator = creator;
    }

    public Group getGroup() {
        return group;
    }
    
    public void setGroup(Group group) {
        this.group = group;
    }

    // Bet Details
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

    public BetType getBetType() {
        return betType;
    }
    
    public void setBetType(BetType betType) {
        this.betType = betType;
    }

    public BetStatus getStatus() {
        return status;
    }
    
    public void setStatus(BetStatus status) {
        this.status = status;
    }

    public BetOutcome getOutcome() {
        return outcome;
    }
    
    public void setOutcome(BetOutcome outcome) {
        this.outcome = outcome;
    }

    public BetResolutionMethod getResolutionMethod() {
        return resolutionMethod;
    }
    
    public void setResolutionMethod(BetResolutionMethod resolutionMethod) {
        this.resolutionMethod = resolutionMethod;
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

    // Betting Mechanics
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

    public BigDecimal getFixedStakeAmount() {
        return fixedStakeAmount;
    }

    public void setFixedStakeAmount(BigDecimal fixedStakeAmount) {
        this.fixedStakeAmount = fixedStakeAmount;
    }

    public BetStakeType getStakeType() {
        return stakeType;
    }

    public void setStakeType(BetStakeType stakeType) {
        this.stakeType = stakeType;
    }

    public String getSocialStakeDescription() {
        return socialStakeDescription;
    }

    public void setSocialStakeDescription(String socialStakeDescription) {
        this.socialStakeDescription = socialStakeDescription;
    }

    public String getSocialStakeTemplate() {
        return socialStakeTemplate;
    }

    public void setSocialStakeTemplate(String socialStakeTemplate) {
        this.socialStakeTemplate = socialStakeTemplate;
    }

    public Boolean getStakeFulfillmentRequired() {
        return stakeFulfillmentRequired;
    }

    public void setStakeFulfillmentRequired(Boolean stakeFulfillmentRequired) {
        this.stakeFulfillmentRequired = stakeFulfillmentRequired;
    }

    public FulfillmentStatus getFulfillmentStatus() {
        return fulfillmentStatus;
    }

    public void setFulfillmentStatus(FulfillmentStatus fulfillmentStatus) {
        this.fulfillmentStatus = fulfillmentStatus;
    }

    public LocalDateTime getLoserClaimedFulfilledAt() {
        return loserClaimedFulfilledAt;
    }

    public void setLoserClaimedFulfilledAt(LocalDateTime loserClaimedFulfilledAt) {
        this.loserClaimedFulfilledAt = loserClaimedFulfilledAt;
    }

    public String getLoserFulfillmentProofUrl() {
        return loserFulfillmentProofUrl;
    }

    public void setLoserFulfillmentProofUrl(String loserFulfillmentProofUrl) {
        this.loserFulfillmentProofUrl = loserFulfillmentProofUrl;
    }

    public String getLoserFulfillmentProofDescription() {
        return loserFulfillmentProofDescription;
    }

    public void setLoserFulfillmentProofDescription(String loserFulfillmentProofDescription) {
        this.loserFulfillmentProofDescription = loserFulfillmentProofDescription;
    }

    public LocalDateTime getAllWinnersConfirmedAt() {
        return allWinnersConfirmedAt;
    }

    public void setAllWinnersConfirmedAt(LocalDateTime allWinnersConfirmedAt) {
        this.allWinnersConfirmedAt = allWinnersConfirmedAt;
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

    public Integer getParticipantsForOption1() {
        return participantsForOption1;
    }
    
    public void setParticipantsForOption1(Integer participantsForOption1) {
        this.participantsForOption1 = participantsForOption1;
    }

    public Integer getParticipantsForOption2() {
        return participantsForOption2;
    }
    
    public void setParticipantsForOption2(Integer participantsForOption2) {
        this.participantsForOption2 = participantsForOption2;
    }

    public BigDecimal getPoolForOption1() {
        return poolForOption1;
    }
    
    public void setPoolForOption1(BigDecimal poolForOption1) {
        this.poolForOption1 = poolForOption1;
    }

    public BigDecimal getPoolForOption2() {
        return poolForOption2;
    }
    
    public void setPoolForOption2(BigDecimal poolForOption2) {
        this.poolForOption2 = poolForOption2;
    }

    // Bet Options
    public String getOption1() {
        return option1;
    }
    
    public void setOption1(String option1) {
        this.option1 = option1;
    }

    public String getOption2() {
        return option2;
    }
    
    public void setOption2(String option2) {
        this.option2 = option2;
    }

    public String getOption3() {
        return option3;
    }
    
    public void setOption3(String option3) {
        this.option3 = option3;
    }

    public String getOption4() {
        return option4;
    }
    
    public void setOption4(String option4) {
        this.option4 = option4;
    }

    // Time Management
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

    // System Fields
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }
    
    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Relationships - Collections
    public List<BetParticipation> getParticipations() {
        return participations;
    }
    
    public void setParticipations(List<BetParticipation> participations) {
        this.participations = participations;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if the bet is currently open for new participants.
     * 
     * @return true if bet is open and before deadline
     */
    public boolean isOpenForBetting() {
        return status == BetStatus.OPEN && 
               bettingDeadline.isAfter(LocalDateTime.now()) &&
               isActive && !isDeleted();
    }

    /**
     * Checks if the bet has been resolved.
     * 
     * @return true if bet has an outcome and resolved timestamp
     */
    public boolean isResolved() {
        return status == BetStatus.RESOLVED && outcome != null && resolvedAt != null;
    }

    /**
     * Checks if the bet has been soft deleted.
     * 
     * @return true if bet is marked as deleted
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if the betting deadline has passed.
     * 
     * @return true if current time is after betting deadline
     */
    public boolean isPastDeadline() {
        return LocalDateTime.now().isAfter(bettingDeadline);
    }

    /**
     * Checks if the given user is the creator of this bet.
     * 
     * @param user the user to check
     * @return true if user is the bet creator
     */
    public boolean isCreator(User user) {
        return creator != null && user != null && 
               creator.getId() != null && user.getId() != null &&
               creator.getId().equals(user.getId());
    }

    /**
     * Calculates the odds for option 1 based on current pool distribution.
     * 
     * @return odds ratio for option 1, or 1.0 if no bets placed
     */
    public double getOddsForOption1() {
        if (poolForOption1.compareTo(BigDecimal.ZERO) == 0) {
            return 1.0;
        }
        return totalPool.divide(poolForOption1, 4, java.math.RoundingMode.HALF_UP).doubleValue();
    }

    /**
     * Calculates the odds for option 2 based on current pool distribution.
     * 
     * @return odds ratio for option 2, or 1.0 if no bets placed
     */
    public double getOddsForOption2() {
        if (poolForOption2.compareTo(BigDecimal.ZERO) == 0) {
            return 1.0;
        }
        return totalPool.divide(poolForOption2, 4, java.math.RoundingMode.HALF_UP).doubleValue();
    }

    /**
     * Adds a bet amount to the specified option pool and updates statistics.
     * 
     * @param option the option number (1 or 2)
     * @param amount the bet amount to add
     */
    public void addBetToOption(int option, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        totalPool = totalPool.add(amount);
        totalParticipants++;

        if (option == 1) {
            poolForOption1 = poolForOption1.add(amount);
            participantsForOption1++;
        } else if (option == 2) {
            poolForOption2 = poolForOption2.add(amount);
            participantsForOption2++;
        }
    }

    /**
     * Resolves the bet with the specified outcome.
     * 
     * @param betOutcome the final outcome of the bet
     */
    public void resolve(BetOutcome betOutcome) {
        this.outcome = betOutcome;
        this.status = BetStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
    }

    /**
     * Cancels the bet and marks it as cancelled.
     */
    public void cancel() {
        this.status = BetStatus.CANCELLED;
        this.resolvedAt = LocalDateTime.now();
    }

    /**
     * Closes the bet for new participants but keeps it unresolved.
     */
    public void close() {
        this.status = BetStatus.CLOSED;
    }

    /**
     * Checks if the bet supports multiple options (more than 2).
     * 
     * @return true if bet type supports multiple options
     */
    public boolean isMultiOption() {
        return betType == BetType.MULTIPLE_CHOICE;
    }

    /**
     * Gets the number of available options for this bet.
     * 
     * @return number of options (2-4)
     */
    public int getOptionCount() {
        int count = 2; // Always have option1 and option2
        if (option3 != null && !option3.trim().isEmpty()) count++;
        if (option4 != null && !option4.trim().isEmpty()) count++;
        return count;
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Types of bets supported by the platform.
     */
    public enum BetType {
        MULTIPLE_CHOICE,  // Up to 4 options
        PREDICTION      // Users predict exact values/outcomes
        // OVER_UNDER       // Over/under a specific threshold (COMMENTED OUT - TODO: Implement later)
    }

    /**
     * Current status of a bet.
     */
    public enum BetStatus {
        OPEN,       // Accepting new participants
        CLOSED,     // No longer accepting participants, awaiting resolution
        RESOLVED,   // Bet has been resolved with an outcome
        CANCELLED   // Bet was cancelled, participants refunded
    }

    /**
     * Possible outcomes for a bet.
     */
    public enum BetOutcome {
        OPTION_1,    // First option won
        OPTION_2,    // Second option won
        OPTION_3,    // Third option won (multiple choice only)
        OPTION_4,    // Fourth option won (multiple choice only)
        DRAW,        // No clear winner
        CANCELLED    // Bet was cancelled
    }

    /**
     * Methods for resolving bets.
     */
    public enum BetResolutionMethod {
        CREATOR_ONLY,       // Only the bet creator can resolve
        ASSIGNED_RESOLVER,  // Creator assigns specific users to resolve
        CONSENSUS_VOTING    // Multiple people vote, majority decides
    }
}
package com.circlebet.entity.betting;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

import com.circlebet.entity.user.User;

/**
 * BetResolutionVote entity representing votes for consensus-based bet resolution.
 * 
 * This entity supports the "Multi-Resolver/Consensus" resolution method where
 * multiple authorized users vote on the bet outcome and majority decides.
 */
@Entity
@Table(name = "bet_resolution_votes", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"bet_id", "voter_id"}),
    indexes = {
        @Index(name = "idx_vote_bet", columnList = "bet_id"),
        @Index(name = "idx_vote_voter", columnList = "voter_id"),
        @Index(name = "idx_vote_outcome", columnList = "votedOutcome"),
        @Index(name = "idx_vote_created", columnList = "createdAt"),
        @Index(name = "idx_vote_bet_outcome", columnList = "bet_id, votedOutcome")
    }
)
public class BetResolutionVote {
    
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
    @JoinColumn(name = "bet_id")
    private Bet bet;

    @ManyToOne(optional = false)
    @JoinColumn(name = "voter_id")
    private User voter;

    // ==========================================
    // VOTE DETAILS
    // ==========================================
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Bet.BetOutcome votedOutcome;

    @Column(length = 1000)
    @Size(max = 1000, message = "Vote reasoning cannot exceed 1000 characters")
    private String reasoning;

    @Column(nullable = false)
    private Boolean isActive = true;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime revokedAt;

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
    public Bet getBet() {
        return bet;
    }
    
    public void setBet(Bet bet) {
        this.bet = bet;
    }

    public User getVoter() {
        return voter;
    }
    
    public void setVoter(User voter) {
        this.voter = voter;
    }

    // Vote Details
    public Bet.BetOutcome getVotedOutcome() {
        return votedOutcome;
    }
    
    public void setVotedOutcome(Bet.BetOutcome votedOutcome) {
        this.votedOutcome = votedOutcome;
    }

    public String getReasoning() {
        return reasoning;
    }
    
    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }


    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    // System Fields
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }
    
    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if this vote is currently active and valid.
     * 
     * @return true if vote should be counted
     */
    public boolean isValidVote() {
        return isActive && revokedAt == null && votedOutcome != null;
    }

    /**
     * Revokes this vote (removes it from consensus calculation).
     */
    public void revoke() {
        this.isActive = false;
        this.revokedAt = LocalDateTime.now();
    }

    /**
     * Reactivates this vote.
     */
    public void reactivate() {
        this.isActive = true;
        this.revokedAt = null;
    }

    /**
     * Updates the vote with a new outcome and reasoning.
     * 
     * @param newOutcome the new voted outcome
     * @param newReasoning the new reasoning
     */
    public void updateVote(Bet.BetOutcome newOutcome, String newReasoning) {
        this.votedOutcome = newOutcome;
        this.reasoning = newReasoning;
    }


    /**
     * Checks if the given user is the voter.
     * 
     * @param user the user to check
     * @return true if user is the voter
     */
    public boolean isVoter(User user) {
        return voter != null && user != null && 
               voter.getId() != null && user.getId() != null &&
               voter.getId().equals(user.getId());
    }


    /**
     * Checks if this vote is for the given outcome.
     * 
     * @param outcome the outcome to check
     * @return true if vote is for this outcome
     */
    public boolean isVoteFor(Bet.BetOutcome outcome) {
        return votedOutcome != null && votedOutcome.equals(outcome);
    }
}
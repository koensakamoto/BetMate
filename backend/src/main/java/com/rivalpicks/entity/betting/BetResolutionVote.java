package com.rivalpicks.entity.betting;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.rivalpicks.entity.user.User;

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
    @Column(nullable = true)  // Nullable for PREDICTION bets which use winner votes instead
    private Bet.BetOutcome votedOutcome;

    /**
     * For PREDICTION bets: selected winners stored via join table.
     */
    @OneToMany(mappedBy = "vote", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<BetResolutionVoteWinner> winnerVotes = new java.util.ArrayList<>();

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
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
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

    public java.util.List<BetResolutionVoteWinner> getWinnerVotes() {
        return winnerVotes;
    }

    public void setWinnerVotes(java.util.List<BetResolutionVoteWinner> winnerVotes) {
        this.winnerVotes = winnerVotes;
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
     * Supports both outcome-based votes and winner-based votes (for PREDICTION bets).
     *
     * @return true if vote should be counted
     */
    public boolean isValidVote() {
        return isActive && revokedAt == null && (votedOutcome != null || hasWinnerVotes());
    }

    /**
     * Checks if this vote has winner selections (for PREDICTION bets).
     *
     * @return true if this vote has winner user selections
     */
    public boolean hasWinnerVotes() {
        return winnerVotes != null && !winnerVotes.isEmpty();
    }

    /**
     * Revokes this vote (removes it from consensus calculation).
     */
    public void revoke() {
        this.isActive = false;
        this.revokedAt = LocalDateTime.now(ZoneOffset.UTC);
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
     * Used for BINARY/MULTIPLE_CHOICE bets.
     *
     * @param newOutcome the new voted outcome
     * @param newReasoning the new reasoning
     */
    public void updateVote(Bet.BetOutcome newOutcome, String newReasoning) {
        this.votedOutcome = newOutcome;
        this.winnerVotes.clear();  // Clear winner votes when using outcome
        this.reasoning = newReasoning;
    }

    /**
     * Clears existing winner votes (for updating PREDICTION bet votes).
     * Call this before adding new winner votes.
     */
    public void clearWinnerVotes() {
        this.votedOutcome = null;  // Clear outcome when using winner votes
        this.winnerVotes.clear();
    }

    /**
     * Adds a winner vote to this resolution vote.
     *
     * @param winnerVote the winner vote to add
     */
    public void addWinnerVote(BetResolutionVoteWinner winnerVote) {
        winnerVotes.add(winnerVote);
        winnerVote.setVote(this);
    }

    /**
     * Gets the winner user IDs as a list.
     *
     * @return list of winner user IDs, or empty list if none
     */
    public java.util.List<Long> getWinnerUserIds() {
        if (winnerVotes == null || winnerVotes.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return winnerVotes.stream()
            .map(wv -> wv.getWinnerUser().getId())
            .collect(java.util.stream.Collectors.toList());
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
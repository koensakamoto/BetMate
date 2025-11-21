package com.betmate.entity.betting;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.betmate.entity.user.User;

/**
 * PredictionResolutionVote entity for tracking resolver votes on individual participant predictions.
 *
 * In prediction bets with multiple resolvers, each resolver votes on whether each participant's
 * prediction was correct or incorrect. The final result for each participant is determined by
 * aggregating votes: >50% correct = WON, <50% correct = LOST, =50% = DRAW.
 *
 * Constraint: A resolver cannot vote on their own participation.
 */
@Entity
@Table(name = "prediction_resolution_votes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"bet_id", "resolver_id", "participation_id"}),
    indexes = {
        @Index(name = "idx_pred_vote_bet", columnList = "bet_id"),
        @Index(name = "idx_pred_vote_resolver", columnList = "resolver_id"),
        @Index(name = "idx_pred_vote_participation", columnList = "participation_id"),
        @Index(name = "idx_pred_vote_created", columnList = "createdAt"),
        @Index(name = "idx_pred_vote_bet_participation", columnList = "bet_id, participation_id")
    }
)
public class PredictionResolutionVote {

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
    @JoinColumn(name = "resolver_id")
    private User resolver;

    @ManyToOne(optional = false)
    @JoinColumn(name = "participation_id")
    private BetParticipation participation;

    // ==========================================
    // VOTE DETAILS
    // ==========================================

    /**
     * Whether the resolver voted that the participant's prediction was correct.
     * true = prediction was correct
     * false = prediction was incorrect
     */
    @Column(nullable = false)
    private Boolean isCorrect;

    @Column(nullable = false)
    private Boolean isActive = true;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

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

    public User getResolver() {
        return resolver;
    }

    public void setResolver(User resolver) {
        this.resolver = resolver;
    }

    public BetParticipation getParticipation() {
        return participation;
    }

    public void setParticipation(BetParticipation participation) {
        this.participation = participation;
    }

    // Vote Details
    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
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

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Checks if this vote is currently active and valid.
     *
     * @return true if vote should be counted
     */
    public boolean isValidVote() {
        return isActive && isCorrect != null;
    }

    /**
     * Updates the vote with a new correctness value.
     *
     * @param correct whether the prediction was correct
     */
    public void updateVote(Boolean correct) {
        this.isCorrect = correct;
    }

    /**
     * Checks if the given user is the resolver who cast this vote.
     *
     * @param user the user to check
     * @return true if user is the resolver
     */
    public boolean isResolver(User user) {
        return resolver != null && user != null &&
               resolver.getId() != null && user.getId() != null &&
               resolver.getId().equals(user.getId());
    }

    /**
     * Gets the participant user ID this vote is about.
     *
     * @return participant user ID
     */
    public Long getParticipantUserId() {
        return participation != null ? participation.getUserId() : null;
    }

    /**
     * Checks if this vote is for the given participation.
     *
     * @param participationId the participation ID to check
     * @return true if vote is for this participation
     */
    public boolean isVoteForParticipation(Long participationId) {
        return participation != null && participation.getId() != null &&
               participation.getId().equals(participationId);
    }
}

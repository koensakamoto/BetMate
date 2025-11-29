package com.rivalpicks.entity.betting;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.rivalpicks.entity.user.User;

/**
 * BetResolutionVoteWinner entity representing a winner selection in a resolution vote.
 *
 * For PREDICTION bets, each resolver votes by selecting which participants they believe
 * are winners. This entity stores each individual winner selection.
 */
@Entity
@Table(name = "bet_resolution_vote_winners",
    uniqueConstraints = @UniqueConstraint(columnNames = {"vote_id", "winner_user_id"}),
    indexes = {
        @Index(name = "idx_vote_winners_vote", columnList = "vote_id"),
        @Index(name = "idx_vote_winners_user", columnList = "winner_user_id")
    }
)
public class BetResolutionVoteWinner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_id")
    private BetResolutionVote vote;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_user_id")
    private User winnerUser;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    // ==========================================
    // CONSTRUCTORS
    // ==========================================

    public BetResolutionVoteWinner() {
    }

    public BetResolutionVoteWinner(BetResolutionVote vote, User winnerUser) {
        this.vote = vote;
        this.winnerUser = winnerUser;
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BetResolutionVote getVote() {
        return vote;
    }

    public void setVote(BetResolutionVote vote) {
        this.vote = vote;
    }

    public User getWinnerUser() {
        return winnerUser;
    }

    public void setWinnerUser(User winnerUser) {
        this.winnerUser = winnerUser;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

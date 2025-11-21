package com.rivalpicks.entity.betting;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Tracks individual winner confirmations for social bet fulfillment.
 * Each record represents one winner confirming they received their stake.
 */
@Entity
@Table(name = "bet_fulfillments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"bet_id", "winner_id"}))
public class BetFulfillment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bet_id", nullable = false)
    private Long betId;

    @Column(name = "winner_id", nullable = false)
    private Long winnerId;

    @Column(name = "confirmed_at", nullable = false)
    private LocalDateTime confirmedAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Constructors
    public BetFulfillment() {}

    public BetFulfillment(Long betId, Long winnerId, String notes) {
        this.betId = betId;
        this.winnerId = winnerId;
        this.notes = notes;
        this.confirmedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBetId() {
        return betId;
    }

    public void setBetId(Long betId) {
        this.betId = betId;
    }

    public Long getWinnerId() {
        return winnerId;
    }

    public void setWinnerId(Long winnerId) {
        this.winnerId = winnerId;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

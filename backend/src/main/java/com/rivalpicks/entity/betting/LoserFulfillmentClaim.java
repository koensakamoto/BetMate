package com.rivalpicks.entity.betting;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Tracks individual loser fulfillment claims for social bets.
 * Each record represents one loser claiming they fulfilled their stake.
 */
@Entity
@Table(name = "loser_fulfillment_claims",
       uniqueConstraints = @UniqueConstraint(columnNames = {"bet_id", "loser_id"}))
public class LoserFulfillmentClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bet_id", nullable = false)
    private Long betId;

    @Column(name = "loser_id", nullable = false)
    private Long loserId;

    @Column(name = "claimed_at", nullable = false)
    private LocalDateTime claimedAt = LocalDateTime.now();

    @Column(name = "proof_url", length = 500)
    private String proofUrl;

    @Column(name = "proof_description", columnDefinition = "TEXT")
    private String proofDescription;

    // Constructors
    public LoserFulfillmentClaim() {}

    public LoserFulfillmentClaim(Long betId, Long loserId, String proofUrl, String proofDescription) {
        this.betId = betId;
        this.loserId = loserId;
        this.proofUrl = proofUrl;
        this.proofDescription = proofDescription;
        this.claimedAt = LocalDateTime.now();
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

    public Long getLoserId() {
        return loserId;
    }

    public void setLoserId(Long loserId) {
        this.loserId = loserId;
    }

    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }

    public void setClaimedAt(LocalDateTime claimedAt) {
        this.claimedAt = claimedAt;
    }

    public String getProofUrl() {
        return proofUrl;
    }

    public void setProofUrl(String proofUrl) {
        this.proofUrl = proofUrl;
    }

    public String getProofDescription() {
        return proofDescription;
    }

    public void setProofDescription(String proofDescription) {
        this.proofDescription = proofDescription;
    }
}

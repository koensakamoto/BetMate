package com.rivalpicks.entity.betting;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Entity representing user predictions for exact value bets.
 * Stores individual user predictions separately from fixed bet options.
 */
@Entity
@Table(name = "bet_predictions", indexes = {
    @Index(name = "idx_prediction_participation", columnList = "participation_id"),
    @Index(name = "idx_prediction_created_at", columnList = "createdAt")
})
public class BetPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "participation_id")
    private BetParticipation participation;

    @Column(nullable = false, length = 500)
    @NotBlank(message = "Predicted value cannot be empty")
    @Size(max = 500, message = "Predicted value cannot exceed 500 characters")
    private String predictedValue;

    @Column(length = 500)
    @Size(max = 500, message = "Actual value cannot exceed 500 characters")
    private String actualValue;

    @Column
    private Boolean isCorrect;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BetParticipation getParticipation() {
        return participation;
    }

    public void setParticipation(BetParticipation participation) {
        this.participation = participation;
    }

    public String getPredictedValue() {
        return predictedValue;
    }

    public void setPredictedValue(String predictedValue) {
        this.predictedValue = predictedValue;
    }

    public String getActualValue() {
        return actualValue;
    }

    public void setActualValue(String actualValue) {
        this.actualValue = actualValue;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Resolves the prediction by comparing with actual value.
     *
     * @param actualValue the actual outcome value
     */
    public void resolve(String actualValue) {
        this.actualValue = actualValue;
        this.isCorrect = predictedValue.trim().equalsIgnoreCase(actualValue.trim());
    }
}
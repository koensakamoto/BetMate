package com.betmate.entity.betting;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import com.betmate.entity.user.User;

/**
 * BetResolver entity representing users who are authorized to resolve specific bets.
 * 
 * This entity supports the "Assigned Resolver" resolution method where the bet creator
 * can designate specific users to resolve the bet outcome.
 */
@Entity
@Table(name = "bet_resolvers", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"bet_id", "resolver_id"}),
    indexes = {
        @Index(name = "idx_resolver_bet", columnList = "bet_id"),
        @Index(name = "idx_resolver_user", columnList = "resolver_id"),
        @Index(name = "idx_resolver_active", columnList = "isActive"),
        @Index(name = "idx_resolver_created", columnList = "createdAt")
    }
)
public class BetResolver {
    
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
    @JoinColumn(name = "assigned_by_id")
    private User assignedBy;

    // ==========================================
    // RESOLVER DETAILS
    // ==========================================
    
    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(length = 500)
    @Size(max = 500, message = "Assignment reason cannot exceed 500 characters")
    private String assignmentReason;

    @Column(nullable = false)
    private Boolean canVoteOnly = false; // If true, can only vote in consensus, cannot resolve alone

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

    public User getResolver() {
        return resolver;
    }
    
    public void setResolver(User resolver) {
        this.resolver = resolver;
    }

    public User getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(User assignedBy) {
        this.assignedBy = assignedBy;
    }

    // Resolver Details
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getAssignmentReason() {
        return assignmentReason;
    }
    
    public void setAssignmentReason(String assignmentReason) {
        this.assignmentReason = assignmentReason;
    }

    public Boolean getCanVoteOnly() {
        return canVoteOnly;
    }
    
    public void setCanVoteOnly(Boolean canVoteOnly) {
        this.canVoteOnly = canVoteOnly;
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
     * Checks if this resolver assignment is currently active.
     * 
     * @return true if resolver can currently resolve the bet
     */
    public boolean isCurrentlyActive() {
        return isActive && revokedAt == null;
    }

    /**
     * Checks if this resolver can independently resolve the bet.
     * 
     * @return true if resolver can resolve without consensus
     */
    public boolean canResolveIndependently() {
        return isCurrentlyActive() && !canVoteOnly;
    }

    /**
     * Checks if this resolver can vote in consensus resolution.
     * 
     * @return true if resolver can participate in voting
     */
    public boolean canVoteInConsensus() {
        return isCurrentlyActive();
    }

    /**
     * Revokes this resolver's permission.
     */
    public void revoke() {
        this.isActive = false;
        this.revokedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    /**
     * Reactivates this resolver's permission.
     */
    public void reactivate() {
        this.isActive = true;
        this.revokedAt = null;
    }

    /**
     * Checks if the given user is the one who assigned this resolver.
     * 
     * @param user the user to check
     * @return true if user assigned this resolver
     */
    public boolean wasAssignedBy(User user) {
        return assignedBy != null && user != null && 
               assignedBy.getId() != null && user.getId() != null &&
               assignedBy.getId().equals(user.getId());
    }

    /**
     * Checks if the given user is this resolver.
     * 
     * @param user the user to check
     * @return true if user is this resolver
     */
    public boolean isResolver(User user) {
        return resolver != null && user != null && 
               resolver.getId() != null && user.getId() != null &&
               resolver.getId().equals(user.getId());
    }
}
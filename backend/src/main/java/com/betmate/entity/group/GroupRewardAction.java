package com.betmate.entity.group;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.betmate.entity.user.User;

/**
 * GroupRewardAction entity representing purchasable actions/effects within a group.
 * 
 * This entity provides a flexible foundation for group economy features where users
 * can spend currency to trigger various actions, effects, or modifications within their group.
 */
@Entity
@Table(name = "group_reward_actions", indexes = {
    @Index(name = "idx_reward_group", columnList = "group_id"),
    @Index(name = "idx_reward_purchaser", columnList = "purchaser_id"),
    @Index(name = "idx_reward_type", columnList = "actionType"),
    @Index(name = "idx_reward_target", columnList = "targetEntityType, targetEntityId"),
    @Index(name = "idx_reward_active", columnList = "isActive"),
    @Index(name = "idx_reward_status", columnList = "status"),
    @Index(name = "idx_reward_created", columnList = "createdAt")
})
public class GroupRewardAction {
    
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
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "purchaser_id")
    private User purchaser;

    // ==========================================
    // ACTION DETAILS
    // ==========================================
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType actionType;

    @Column(nullable = false, length = 200)
    @Size(min = 1, max = 200, message = "Action name must be between 1 and 200 characters")
    private String actionName;

    @Column(length = 1000)
    private String actionDescription;

    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.01", message = "Cost must be at least 0.01")
    private BigDecimal cost;

    // ==========================================
    // TARGET & PARAMETERS
    // ==========================================
    
    @Column(length = 50)
    private String targetEntityType;

    private Long targetEntityId;

    @ManyToOne
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    @Column(length = 2000)
    private String actionParameters;

    // ==========================================
    // EXECUTION & STATUS
    // ==========================================
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionStatus status = ActionStatus.PENDING;

    private LocalDateTime scheduledFor;

    private LocalDateTime executedAt;

    @Column(length = 1000)
    private String executionResult;

    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime expiresAt;

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
    public Group getGroup() {
        return group;
    }
    
    public void setGroup(Group group) {
        this.group = group;
    }

    public User getPurchaser() {
        return purchaser;
    }
    
    public void setPurchaser(User purchaser) {
        this.purchaser = purchaser;
    }

    // Action Details
    public ActionType getActionType() {
        return actionType;
    }
    
    public void setActionType(ActionType actionType) {
        this.actionType = actionType;
    }

    public String getActionName() {
        return actionName;
    }
    
    public void setActionName(String actionName) {
        this.actionName = actionName;
    }

    public String getActionDescription() {
        return actionDescription;
    }
    
    public void setActionDescription(String actionDescription) {
        this.actionDescription = actionDescription;
    }

    public BigDecimal getCost() {
        return cost;
    }
    
    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    // Target & Parameters
    public String getTargetEntityType() {
        return targetEntityType;
    }
    
    public void setTargetEntityType(String targetEntityType) {
        this.targetEntityType = targetEntityType;
    }

    public Long getTargetEntityId() {
        return targetEntityId;
    }
    
    public void setTargetEntityId(Long targetEntityId) {
        this.targetEntityId = targetEntityId;
    }

    public User getTargetUser() {
        return targetUser;
    }
    
    public void setTargetUser(User targetUser) {
        this.targetUser = targetUser;
    }

    public String getActionParameters() {
        return actionParameters;
    }
    
    public void setActionParameters(String actionParameters) {
        this.actionParameters = actionParameters;
    }

    // Execution & Status
    public ActionStatus getStatus() {
        return status;
    }
    
    public void setStatus(ActionStatus status) {
        this.status = status;
    }

    public LocalDateTime getScheduledFor() {
        return scheduledFor;
    }
    
    public void setScheduledFor(LocalDateTime scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }
    
    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }

    public String getExecutionResult() {
        return executionResult;
    }
    
    public void setExecutionResult(String executionResult) {
        this.executionResult = executionResult;
    }

    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
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
     * Checks if the action is ready to be executed.
     * 
     * @return true if action is pending and scheduled time has arrived
     */
    public boolean isReadyForExecution() {
        return status == ActionStatus.PENDING && 
               isActive && 
               (scheduledFor == null || LocalDateTime.now().isAfter(scheduledFor)) &&
               !isExpired();
    }

    /**
     * Checks if the action has expired.
     * 
     * @return true if action has passed its expiration time
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Marks the action as executed with a result.
     * 
     * @param result execution result message
     */
    public void markExecuted(String result) {
        this.status = ActionStatus.EXECUTED;
        this.executedAt = LocalDateTime.now();
        this.executionResult = result;
    }

    /**
     * Marks the action as failed with an error message.
     * 
     * @param errorMessage why the action failed
     */
    public void markFailed(String errorMessage) {
        this.status = ActionStatus.FAILED;
        this.executionResult = "Failed: " + errorMessage;
    }

    /**
     * Cancels the action.
     */
    public void cancel() {
        this.status = ActionStatus.CANCELLED;
        this.isActive = false;
    }

    /**
     * Checks if the action has a specific target.
     * 
     * @return true if action targets a specific entity or user
     */
    public boolean hasTarget() {
        return (targetEntityType != null && targetEntityId != null) || targetUser != null;
    }

    /**
     * Sets the target entity for this action.
     * 
     * @param entityType type of entity (BET, USER, etc.)
     * @param entityId ID of the target entity
     */
    public void setTarget(String entityType, Long entityId) {
        this.targetEntityType = entityType;
        this.targetEntityId = entityId;
    }

    /**
     * Gets a formatted cost string.
     * 
     * @return cost with currency suffix
     */
    public String getFormattedCost() {
        return cost.stripTrailingZeros().toPlainString() + " credits";
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Types of actions that can be purchased in groups.
     * This is intentionally generic to allow for future expansion.
     */
    public enum ActionType {
        // Social Actions
        SOCIAL_CHALLENGE,       // Make someone do something fun
        SOCIAL_IMMUNITY,        // Protect someone from consequences
        SOCIAL_BOOST,          // Give someone a temporary advantage
        
        // Bet Modifiers  
        BET_ENHANCEMENT,       // Add special rules to a bet
        BET_PROTECTION,        // Protect from bet consequences
        BET_AMPLIFICATION,     // Increase bet stakes or effects
        
        // Group Effects
        GROUP_EVENT,           // Trigger a group-wide event
        GROUP_REWARD,          // Give rewards to group members
        GROUP_CHALLENGE,       // Start a group challenge
        
        // Custom Actions
        CUSTOM_ACTION         // Flexible action type for future features
    }

    /**
     * Status of an action in the execution pipeline.
     */
    public enum ActionStatus {
        PENDING,              // Waiting to be executed
        SCHEDULED,            // Scheduled for future execution
        EXECUTING,            // Currently being executed
        EXECUTED,             // Successfully completed
        FAILED,               // Execution failed
        CANCELLED,            // Action was cancelled
        EXPIRED               // Action expired before execution
    }
}
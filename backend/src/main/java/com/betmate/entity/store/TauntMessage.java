package com.betmate.entity.store;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

/**
 * TauntMessage entity representing pre-written roast/taunt messages.
 * 
 * This entity stores the actual taunt/roast messages that users can purchase
 * and use in social interactions. Messages are organized by category and rarity.
 */
@Entity
@Table(name = "taunt_messages", indexes = {
    @Index(name = "idx_taunt_category", columnList = "category"),
    @Index(name = "idx_taunt_rarity", columnList = "rarity"),
    @Index(name = "idx_taunt_active", columnList = "isActive"),
    @Index(name = "idx_taunt_pack", columnList = "packName"),
    @Index(name = "idx_taunt_usage", columnList = "totalUsage")
})
public class TauntMessage {
    
    // ==========================================
    // IDENTITY
    // ==========================================
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // MESSAGE CONTENT
    // ==========================================
    
    @Column(nullable = false, length = 300)
    @Size(min = 10, max = 300, message = "Taunt message must be between 10 and 300 characters")
    private String messageText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TauntCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StoreItem.Rarity rarity = StoreItem.Rarity.COMMON;

    // ==========================================
    // ORGANIZATION
    // ==========================================
    
    @Column(length = 100)
    private String packName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer sortOrder = 0;

    // ==========================================
    // USAGE TRACKING
    // ==========================================
    
    @Column(nullable = false)
    private Long totalUsage = 0L;

    @Column(nullable = false)
    private Boolean isActive = true;

    // ==========================================
    // MODERATION
    // ==========================================
    
    @Column(nullable = false)
    private Boolean isApproved = true;

    @Column(nullable = false)
    private Boolean isReported = false;

    @Column(length = 500)
    private String moderationNotes;

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

    // Message Content
    public String getMessageText() {
        return messageText;
    }
    
    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public TauntCategory getCategory() {
        return category;
    }
    
    public void setCategory(TauntCategory category) {
        this.category = category;
    }

    public StoreItem.Rarity getRarity() {
        return rarity;
    }
    
    public void setRarity(StoreItem.Rarity rarity) {
        this.rarity = rarity;
    }

    // Organization
    public String getPackName() {
        return packName;
    }
    
    public void setPackName(String packName) {
        this.packName = packName;
    }

    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }
    
    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    // Usage Tracking
    public Long getTotalUsage() {
        return totalUsage;
    }
    
    public void setTotalUsage(Long totalUsage) {
        this.totalUsage = totalUsage;
    }

    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    // Moderation
    public Boolean getIsApproved() {
        return isApproved;
    }
    
    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
    }

    public Boolean getIsReported() {
        return isReported;
    }
    
    public void setIsReported(Boolean isReported) {
        this.isReported = isReported;
    }

    public String getModerationNotes() {
        return moderationNotes;
    }
    
    public void setModerationNotes(String moderationNotes) {
        this.moderationNotes = moderationNotes;
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
     * Checks if the taunt message is available for use.
     * 
     * @return true if message is active, approved, and not reported
     */
    public boolean isAvailableForUse() {
        return isActive && isApproved && !isReported;
    }

    /**
     * Records usage of this taunt message.
     */
    public void recordUsage() {
        totalUsage++;
    }

    /**
     * Checks if this is a popular taunt (used more than 100 times).
     * 
     * @return true if message has high usage
     */
    public boolean isPopular() {
        return totalUsage > 100;
    }

    /**
     * Checks if this is a rare or better quality taunt.
     * 
     * @return true if rarity is RARE, EPIC, or LEGENDARY
     */
    public boolean isHighQuality() {
        return rarity == StoreItem.Rarity.RARE || 
               rarity == StoreItem.Rarity.EPIC || 
               rarity == StoreItem.Rarity.LEGENDARY;
    }

    /**
     * Gets the rarity color code for UI display.
     * 
     * @return hex color code for rarity
     */
    public String getRarityColor() {
        return switch (rarity) {
            case COMMON -> "#9CA3AF";      // Gray
            case UNCOMMON -> "#10B981";    // Green  
            case RARE -> "#3B82F6";        // Blue
            case EPIC -> "#8B5CF6";        // Purple
            case LEGENDARY -> "#F59E0B";   // Orange/Gold
        };
    }

    /**
     * Gets a preview of the message (first 50 characters).
     * 
     * @return truncated message for previews
     */
    public String getPreview() {
        if (messageText == null) {
            return "";
        }
        return messageText.length() > 50 ? 
            messageText.substring(0, 47) + "..." : 
            messageText;
    }

    /**
     * Checks if the message belongs to a pack.
     * 
     * @return true if message is part of a named pack
     */
    public boolean isPartOfPack() {
        return packName != null && !packName.trim().isEmpty();
    }

    /**
     * Deactivates the taunt message (removes from available pool).
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * Reactivates the taunt message.
     */
    public void reactivate() {
        this.isActive = true;
    }

    /**
     * Marks the message as reported for moderation review.
     * 
     * @param notes optional moderation notes
     */
    public void reportForModeration(String notes) {
        this.isReported = true;
        this.moderationNotes = notes;
        this.isActive = false; // Temporarily disable until reviewed
    }

    /**
     * Approves the message after moderation review.
     */
    public void approve() {
        this.isApproved = true;
        this.isReported = false;
        this.isActive = true;
        this.moderationNotes = "Approved after review";
    }

    /**
     * Rejects the message after moderation review.
     * 
     * @param reason reason for rejection
     */
    public void reject(String reason) {
        this.isApproved = false;
        this.isActive = false;
        this.moderationNotes = "Rejected: " + reason;
    }

    /**
     * Checks if the message needs moderation attention.
     * 
     * @return true if reported or not approved
     */
    public boolean needsModeration() {
        return isReported || !isApproved;
    }

    /**
     * Gets the category display name.
     * 
     * @return formatted category name
     */
    public String getCategoryDisplayName() {
        return category.getDisplayName();
    }

    /**
     * Checks if this is a victory taunt.
     * 
     * @return true if category is VICTORY
     */
    public boolean isVictoryTaunt() {
        return category == TauntCategory.VICTORY;
    }

    /**
     * Checks if this is a defeat consolation.
     * 
     * @return true if category is CONSOLATION
     */
    public boolean isConsolationTaunt() {
        return category == TauntCategory.CONSOLATION;
    }

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Categories for organizing taunt messages.
     */
    public enum TauntCategory {
        VICTORY("Victory Taunts"),           // Messages for when you win
        DEFEAT("Defeat Comebacks"),         // Messages for when you lose  
        CHALLENGE("Challenge Calls"),       // Messages for issuing challenges
        CONSOLATION("Consolations"),        // Messages to console losers
        GENERAL("General Roasts"),          // General purpose taunts
        SEASONAL("Seasonal Specials"),      // Holiday/season themed
        LEGENDARY("Legendary Burns");       // Ultra rare, devastating taunts

        private final String displayName;

        TauntCategory(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
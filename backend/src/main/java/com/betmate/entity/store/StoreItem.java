package com.betmate.entity.store;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * StoreItem entity representing items available for purchase in the store.
 * 
 * This entity handles the catalog of permanent items users can buy including
 * titles, roast cards, avatar skins, badges, and themes.
 */
@Entity
@Table(name = "store_items", indexes = {
    @Index(name = "idx_store_item_type", columnList = "itemType"),
    @Index(name = "idx_store_item_category", columnList = "category"),
    @Index(name = "idx_store_item_active", columnList = "isActive"),
    @Index(name = "idx_store_item_featured", columnList = "isFeatured"),
    @Index(name = "idx_store_item_price", columnList = "price")
})
public class StoreItem {
    
    // ==========================================
    // IDENTITY
    // ==========================================
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // ITEM DETAILS
    // ==========================================
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType itemType;

    @Column(nullable = false, length = 100)
    @Size(min = 1, max = 100, message = "Item name must be between 1 and 100 characters")
    private String name;

    @Column(length = 500)
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemCategory category;

    @Column(length = 500)
    private String iconUrl;

    @Column(length = 2000)
    private String previewData; // JSON for previewing the item (colors, images, etc.)

    // ==========================================
    // STORE MECHANICS
    // ==========================================
    
    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "1.00", message = "Price must be at least 1.00")
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rarity rarity = Rarity.COMMON;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean isFeatured = false;

    @Column(nullable = false)
    private Boolean isLimitedTime = false;

    private LocalDateTime availableUntil;

    @Column(nullable = false)
    private Integer sortOrder = 0;

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

    // Item Details
    public ItemType getItemType() {
        return itemType;
    }
    
    public void setItemType(ItemType itemType) {
        this.itemType = itemType;
    }

    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }

    public ItemCategory getCategory() {
        return category;
    }
    
    public void setCategory(ItemCategory category) {
        this.category = category;
    }

    public String getIconUrl() {
        return iconUrl;
    }
    
    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    public String getPreviewData() {
        return previewData;
    }
    
    public void setPreviewData(String previewData) {
        this.previewData = previewData;
    }

    // Store Mechanics
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Rarity getRarity() {
        return rarity;
    }
    
    public void setRarity(Rarity rarity) {
        this.rarity = rarity;
    }

    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsFeatured() {
        return isFeatured;
    }
    
    public void setIsFeatured(Boolean isFeatured) {
        this.isFeatured = isFeatured;
    }

    public Boolean getIsLimitedTime() {
        return isLimitedTime;
    }
    
    public void setIsLimitedTime(Boolean isLimitedTime) {
        this.isLimitedTime = isLimitedTime;
    }

    public LocalDateTime getAvailableUntil() {
        return availableUntil;
    }
    
    public void setAvailableUntil(LocalDateTime availableUntil) {
        this.availableUntil = availableUntil;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }
    
    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    // System Fields
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Alias method for compatibility
    public ItemType getType() {
        return itemType;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if the item is currently available for purchase.
     * 
     * @return true if item can be purchased now
     */
    public boolean isAvailableForPurchase() {
        if (!isActive) {
            return false;
        }

        if (isLimitedTime && availableUntil != null) {
            return LocalDateTime.now().isBefore(availableUntil);
        }

        return true;
    }

    /**
     * Checks if the item is expired (limited time item past its deadline).
     * 
     * @return true if item is no longer available
     */
    public boolean isExpired() {
        return isLimitedTime && 
               availableUntil != null && 
               LocalDateTime.now().isAfter(availableUntil);
    }

    /**
     * Gets a formatted price string for display.
     * 
     * @return formatted price string
     */
    public String getFormattedPrice() {
        return price.stripTrailingZeros().toPlainString() + " credits";
    }

    /**
     * Checks if this is a social interaction item.
     * 
     * @return true if item is for social features
     */
    public boolean isSocialItem() {
        return category == ItemCategory.SOCIAL;
    }

    /**
     * Checks if this is a cosmetic customization item.
     * 
     * @return true if item is for appearance customization
     */
    public boolean isCosmeticItem() {
        return category == ItemCategory.CUSTOMIZATION;
    }

    /**
     * Checks if this is a progression/achievement item.
     * 
     * @return true if item is for progression/status
     */
    public boolean isProgressionItem() {
        return category == ItemCategory.PROGRESSION;
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

    // ==========================================
    // ENUMS
    // ==========================================
    
    /**
     * Types of store items available for purchase.
     */
    public enum ItemType {
        // Social Power Moves
        ROAST_CARD_PACK,        // Pack of roast/taunt messages
        TAUNT_COLLECTION,       // Collection of taunt messages
        
        // Progression & Legacy  
        TITLE,                  // User titles like "King of Bets"
        BADGE,                  // Achievement badges
        
        // Customization & Fun
        AVATAR_SKIN,            // Profile avatar designs
        PROFILE_THEME,          // Profile color themes
        PROFILE_FRAME,          // Decorative profile borders
        EMOJI_PACK,             // Custom emoji collections
        CHAT_EFFECT            // Special message effects
    }

    /**
     * Categories for organizing store items.
     */
    public enum ItemCategory {
        SOCIAL,                 // Items for social interactions (roasts, taunts)
        PROGRESSION,            // Items for status and achievements (titles, badges)
        CUSTOMIZATION          // Items for appearance and personalization
    }

    /**
     * Rarity levels affecting price and appearance.
     */
    public enum Rarity {
        COMMON,                 // Basic items, lower cost
        UNCOMMON,               // Slightly special items
        RARE,                   // Notable items, higher cost
        EPIC,                   // Very special items
        LEGENDARY              // Exclusive items, highest cost
    }
}
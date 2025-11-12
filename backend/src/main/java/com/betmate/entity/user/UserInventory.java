package com.betmate.entity.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.betmate.entity.store.StoreItem;

/**
 * UserInventory entity representing items owned by users.
 * 
 * This entity tracks permanent store items that users have purchased,
 * including titles, roast cards, avatar skins, badges, and themes.
 */
@Entity
@Table(name = "user_inventory", indexes = {
    @Index(name = "idx_inventory_user", columnList = "user_id"),
    @Index(name = "idx_inventory_item", columnList = "store_item_id"),
    @Index(name = "idx_inventory_user_item", columnList = "user_id, store_item_id"),
    @Index(name = "idx_inventory_active", columnList = "isActive"),
    @Index(name = "idx_inventory_equipped", columnList = "isEquipped"),
    @Index(name = "idx_inventory_purchased", columnList = "purchasedAt")
})
public class UserInventory {
    
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
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "store_item_id")
    private StoreItem storeItem;

    // ==========================================
    // OWNERSHIP DETAILS
    // ==========================================
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime purchasedAt;

    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Purchase price cannot be negative")
    private BigDecimal purchasePrice;

    @Column(nullable = false)
    private Boolean isActive = true;

    // ==========================================
    // ITEM USAGE
    // ==========================================

    @Column(nullable = false)
    private Boolean isEquipped = false;

    private LocalDateTime lastUsedAt;

    private LocalDateTime equippedAt;

    // ==========================================
    // BOOSTER/CONSUMABLE TRACKING
    // ==========================================

    private LocalDateTime activatedAt;

    private Integer usesRemaining;

    private LocalDateTime expiresAt;

    // ==========================================
    // SYSTEM FIELDS
    // ==========================================
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ==========================================
    // REMOVAL TRACKING
    // ==========================================
    
    private LocalDateTime removedAt;
    
    private String removalReason;

    // ==========================================
    // LIFECYCLE CALLBACKS
    // ==========================================
    
    @PrePersist
    protected void onCreate() {
        purchasedAt = LocalDateTime.now();
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
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }

    public StoreItem getStoreItem() {
        return storeItem;
    }
    
    public void setStoreItem(StoreItem storeItem) {
        this.storeItem = storeItem;
    }

    // Ownership Details
    public LocalDateTime getPurchasedAt() {
        return purchasedAt;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }
    
    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    // Item Usage
    public Boolean getIsEquipped() {
        return isEquipped;
    }
    
    public void setIsEquipped(Boolean isEquipped) {
        this.isEquipped = isEquipped;
    }

    public LocalDateTime getLastUsedAt() {
        return lastUsedAt;
    }
    
    public void setLastUsedAt(LocalDateTime lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public LocalDateTime getEquippedAt() {
        return equippedAt;
    }
    
    public void setEquippedAt(LocalDateTime equippedAt) {
        this.equippedAt = equippedAt;
    }

    // Booster/Consumable Tracking
    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }

    public void setActivatedAt(LocalDateTime activatedAt) {
        this.activatedAt = activatedAt;
    }

    public Integer getUsesRemaining() {
        return usesRemaining;
    }

    public void setUsesRemaining(Integer usesRemaining) {
        this.usesRemaining = usesRemaining;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    // System Fields
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Removal Tracking
    public LocalDateTime getRemovedAt() {
        return removedAt;
    }
    
    public void setRemovedAt(LocalDateTime removedAt) {
        this.removedAt = removedAt;
    }

    public String getRemovalReason() {
        return removalReason;
    }
    
    public void setRemovalReason(String removalReason) {
        this.removalReason = removalReason;
    }

    // Alias method for compatibility
    public BigDecimal getPricePaid() {
        return purchasePrice;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Checks if the inventory item is currently usable.
     * 
     * @return true if item is active and can be used
     */
    public boolean isUsable() {
        return isActive && storeItem != null && storeItem.isAvailableForPurchase();
    }

    /**
     * Equips this item for the user (e.g., sets as active title/theme).
     * This method should be used carefully to ensure only one item of each type is equipped.
     */
    public void equip() {
        if (isUsable()) {
            this.isEquipped = true;
        }
    }

    /**
     * Unequips this item for the user.
     */
    public void unequip() {
        this.isEquipped = false;
    }

    /**
     * Deactivates this inventory item (soft delete).
     * Used when an item needs to be removed from user's inventory.
     */
    public void deactivate() {
        this.isActive = false;
        this.isEquipped = false;
    }

    /**
     * Reactivates this inventory item.
     */
    public void reactivate() {
        this.isActive = true;
    }

    /**
     * Checks if this is a cosmetic item that can be equipped.
     *
     * @return true if item can be equipped (titles, themes, avatar skins, etc.)
     */
    public boolean isEquippableItem() {
        if (storeItem == null) {
            return false;
        }

        return switch (storeItem.getItemType()) {
            case TITLE, AVATAR_SKIN, PROFILE_THEME, PROFILE_FRAME -> true;
            case ROAST_CARD_PACK, TAUNT_COLLECTION, BADGE, EMOJI_PACK, CHAT_EFFECT,
                 BET_INSURANCE, FREEZE_CARD, HEDGE_HELPER, MULLIGAN_TOKEN,
                 MULTIPLIER, CREDIT_BOOSTER, TIME_EXTENSION, SURE_SHOT,
                 SIDE_BET_CREATOR, DISCOUNT_TICKET, VIP_PASS,
                 DAILY_BOOSTER, CHALLENGE_BOOSTER, REFERRAL_BOOSTER -> false;
        };
    }

    /**
     * Checks if this is a consumable/usable item (gameplay items, roast cards, emoji packs).
     *
     * @return true if item is consumable
     */
    public boolean isConsumableItem() {
        if (storeItem == null) {
            return false;
        }

        return switch (storeItem.getItemType()) {
            case ROAST_CARD_PACK, TAUNT_COLLECTION, EMOJI_PACK, CHAT_EFFECT,
                 BET_INSURANCE, FREEZE_CARD, HEDGE_HELPER, MULLIGAN_TOKEN,
                 MULTIPLIER, CREDIT_BOOSTER, TIME_EXTENSION, SURE_SHOT,
                 SIDE_BET_CREATOR, DISCOUNT_TICKET, VIP_PASS,
                 DAILY_BOOSTER, CHALLENGE_BOOSTER, REFERRAL_BOOSTER -> true;
            case TITLE, AVATAR_SKIN, PROFILE_THEME, PROFILE_FRAME, BADGE -> false;
        };
    }

    /**
     * Checks if this is a collectible item (badges, titles).
     *
     * @return true if item is a collectible
     */
    public boolean isCollectibleItem() {
        if (storeItem == null) {
            return false;
        }

        return switch (storeItem.getItemType()) {
            case BADGE, TITLE -> true;
            case ROAST_CARD_PACK, TAUNT_COLLECTION, AVATAR_SKIN, PROFILE_THEME, PROFILE_FRAME, EMOJI_PACK, CHAT_EFFECT,
                 BET_INSURANCE, FREEZE_CARD, HEDGE_HELPER, MULLIGAN_TOKEN,
                 MULTIPLIER, CREDIT_BOOSTER, TIME_EXTENSION, SURE_SHOT,
                 SIDE_BET_CREATOR, DISCOUNT_TICKET, VIP_PASS,
                 DAILY_BOOSTER, CHALLENGE_BOOSTER, REFERRAL_BOOSTER -> false;
        };
    }

    /**
     * Gets the item name from the store item.
     * 
     * @return item name or "Unknown Item" if store item is null
     */
    public String getItemName() {
        return storeItem != null ? storeItem.getName() : "Unknown Item";
    }

    /**
     * Gets the item type from the store item.
     * 
     * @return item type or null if store item is null
     */
    public StoreItem.ItemType getItemType() {
        return storeItem != null ? storeItem.getItemType() : null;
    }

    /**
     * Gets the item rarity from the store item.
     * 
     * @return item rarity or null if store item is null
     */
    public StoreItem.Rarity getItemRarity() {
        return storeItem != null ? storeItem.getRarity() : null;
    }

    /**
     * Checks if the item was purchased recently (within the last 7 days).
     * 
     * @return true if item was purchased in the last week
     */
    public boolean isRecentPurchase() {
        if (purchasedAt == null) {
            return false;
        }
        return purchasedAt.isAfter(LocalDateTime.now().minusDays(7));
    }

    /**
     * Gets the age of this inventory item in days.
     * 
     * @return number of days since purchase
     */
    public long getAgeInDays() {
        if (purchasedAt == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(
            purchasedAt.toLocalDate(), 
            LocalDateTime.now().toLocalDate()
        );
    }

    /**
     * Checks if the item has been used recently (within the last 30 days).
     * 
     * @return true if item was used in the last month
     */
    public boolean isRecentlyUsed() {
        if (lastUsedAt == null) {
            return false;
        }
        return lastUsedAt.isAfter(LocalDateTime.now().minusDays(30));
    }

    /**
     * Gets a formatted purchase price string.
     * 
     * @return formatted price string
     */
    public String getFormattedPurchasePrice() {
        return purchasePrice.stripTrailingZeros().toPlainString() + " credits";
    }

    /**
     * Creates a new inventory entry for a user purchasing a store item.
     *
     * @param user the user making the purchase
     * @param storeItem the item being purchased
     * @param actualPrice the price paid (may differ from current store price)
     * @return new UserInventory instance
     */
    public static UserInventory createPurchase(User user, StoreItem storeItem, BigDecimal actualPrice) {
        UserInventory inventory = new UserInventory();
        inventory.setUser(user);
        inventory.setStoreItem(storeItem);
        inventory.setPurchasePrice(actualPrice);

        // Auto-equip certain types of items if user doesn't have any equipped
        if (inventory.isEquippableItem()) {
            // Note: In a real implementation, you'd check if user has other items of this type equipped
            // For now, we'll leave isEquipped as false and let the service layer handle it
        }

        return inventory;
    }

    // ==========================================
    // BOOSTER/CONSUMABLE UTILITY METHODS
    // ==========================================

    /**
     * Checks if this is an active booster (use-based or time-based).
     *
     * @return true if booster is active and valid
     */
    public boolean isActiveBooster() {
        if (!isActive || activatedAt == null) {
            return false;
        }

        // Time-based booster (has expiresAt, no usesRemaining)
        if (expiresAt != null && usesRemaining == null) {
            return expiresAt.isAfter(LocalDateTime.now());
        }

        // Use-based booster (has usesRemaining)
        if (usesRemaining != null && usesRemaining > 0) {
            // Also check expiration if set
            return expiresAt == null || expiresAt.isAfter(LocalDateTime.now());
        }

        return false;
    }

    /**
     * Checks if booster has remaining uses.
     *
     * @return true if uses remaining > 0
     */
    public boolean hasUsesRemaining() {
        return usesRemaining != null && usesRemaining > 0;
    }

    /**
     * Activates this booster with specified number of uses.
     *
     * @param initialUses number of uses this booster should have
     */
    public void activateBooster(int initialUses) {
        this.activatedAt = LocalDateTime.now();
        this.usesRemaining = initialUses;
        this.isActive = true;
    }

    /**
     * Activates this booster for a specified duration in days.
     * Used for time-based boosters like Daily Bonus Doublers.
     * Expiration is set to 11:59:59 PM on the last day for better UX.
     *
     * @param durationDays number of days this booster should be active
     */
    public void activateBoosterForDuration(int durationDays) {
        this.activatedAt = LocalDateTime.now();
        // Expire at 11:59:59 PM on the last day for better UX
        LocalDate purchaseDate = LocalDate.now();
        LocalDate expirationDate = purchaseDate.plusDays(durationDays);
        this.expiresAt = expirationDate.atTime(23, 59, 59);
        this.isActive = true;
        // Set usesRemaining to null for time-based boosters (not use-based)
        this.usesRemaining = null;
    }

    /**
     * Decrements the remaining uses of this booster.
     * Deactivates the booster if no uses remain.
     */
    public void decrementUse() {
        if (usesRemaining != null && usesRemaining > 0) {
            usesRemaining--;
            lastUsedAt = LocalDateTime.now();

            if (usesRemaining == 0) {
                deactivate();
            }
        }
    }

    /**
     * Checks if booster has expired.
     *
     * @return true if booster has an expiration date and it has passed
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
}
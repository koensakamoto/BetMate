package com.betmate.dto.store.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for inventory items.
 * Contains safe data for exposing to clients without sensitive internal details.
 */
public class InventoryItemResponseDto {
    
    private Long id;
    private String itemName;
    private String itemType;
    private String rarity;
    private String iconUrl;
    private String description;
    private BigDecimal purchasePrice;
    private LocalDateTime purchasedAt;
    private Boolean isEquipped;
    private LocalDateTime equippedAt;
    private Long usageCount = 0L; // Default to 0 since not implemented in entity yet
    private LocalDateTime lastUsedAt;
    private Boolean isActive;

    // Default constructor
    public InventoryItemResponseDto() {}

    // Constructor for essential fields
    public InventoryItemResponseDto(Long id, String itemName, String itemType, String rarity, 
                               Boolean isEquipped, LocalDateTime purchasedAt) {
        this.id = id;
        this.itemName = itemName;
        this.itemType = itemType;
        this.rarity = rarity;
        this.isEquipped = isEquipped;
        this.purchasedAt = purchasedAt;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public String getRarity() {
        return rarity;
    }

    public void setRarity(String rarity) {
        this.rarity = rarity;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public LocalDateTime getPurchasedAt() {
        return purchasedAt;
    }

    public void setPurchasedAt(LocalDateTime purchasedAt) {
        this.purchasedAt = purchasedAt;
    }

    public Boolean getIsEquipped() {
        return isEquipped;
    }

    public void setIsEquipped(Boolean isEquipped) {
        this.isEquipped = isEquipped;
    }

    public LocalDateTime getEquippedAt() {
        return equippedAt;
    }

    public void setEquippedAt(LocalDateTime equippedAt) {
        this.equippedAt = equippedAt;
    }

    public Long getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Long usageCount) {
        this.usageCount = usageCount;
    }

    public LocalDateTime getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(LocalDateTime lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
package com.betmate.dto.store.response;

import java.time.LocalDateTime;

/**
 * Response DTO for equipped items in user loadout.
 * Contains minimal data needed to display equipped items.
 */
public class EquippedItemResponseDto {
    
    private Long inventoryId;
    private String itemName;
    private String iconUrl;
    private LocalDateTime equippedAt;
    private String rarity;
    private String itemType;

    // Default constructor
    public EquippedItemResponseDto() {}

    // Constructor
    public EquippedItemResponseDto(Long inventoryId, String itemName, String iconUrl, 
                              LocalDateTime equippedAt, String rarity) {
        this.inventoryId = inventoryId;
        this.itemName = itemName;
        this.iconUrl = iconUrl;
        this.equippedAt = equippedAt;
        this.rarity = rarity;
    }

    // Getters and setters
    public Long getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Long inventoryId) {
        this.inventoryId = inventoryId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    public LocalDateTime getEquippedAt() {
        return equippedAt;
    }

    public void setEquippedAt(LocalDateTime equippedAt) {
        this.equippedAt = equippedAt;
    }

    public String getRarity() {
        return rarity;
    }

    public void setRarity(String rarity) {
        this.rarity = rarity;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }
}
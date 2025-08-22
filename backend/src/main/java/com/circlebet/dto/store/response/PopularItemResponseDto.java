package com.circlebet.dto.store.response;

/**
 * Response DTO for popular items across all users.
 * Replaces the Object[] return type for better type safety.
 */
public class PopularItemResponseDto {
    
    private Long storeItemId;
    private String itemName;
    private String itemType;
    private String rarity;
    private String iconUrl;
    private Long ownerCount;

    // Default constructor
    public PopularItemResponseDto() {}

    // Constructor
    public PopularItemResponseDto(Long storeItemId, String itemName, String itemType, 
                             String rarity, String iconUrl, Long ownerCount) {
        this.storeItemId = storeItemId;
        this.itemName = itemName;
        this.itemType = itemType;
        this.rarity = rarity;
        this.iconUrl = iconUrl;
        this.ownerCount = ownerCount;
    }

    // Getters and setters
    public Long getStoreItemId() {
        return storeItemId;
    }

    public void setStoreItemId(Long storeItemId) {
        this.storeItemId = storeItemId;
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

    public Long getOwnerCount() {
        return ownerCount;
    }

    public void setOwnerCount(Long ownerCount) {
        this.ownerCount = ownerCount;
    }
}
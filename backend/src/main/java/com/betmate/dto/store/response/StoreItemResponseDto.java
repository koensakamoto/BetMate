package com.betmate.dto.store.response;

import com.betmate.entity.store.StoreItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for store items available for purchase.
 */
public class StoreItemResponseDto {
    
    private Long id;
    private StoreItem.ItemType itemType;
    private String name;
    private String shortDescription;
    private String description;
    private StoreItem.ItemCategory category;
    private String iconUrl;
    private String previewData;
    private BigDecimal price;
    private StoreItem.Rarity rarity;
    private String rarityColor;
    private Boolean isActive;
    private Boolean isFeatured;
    private Boolean isLimitedTime;
    private LocalDateTime availableUntil;
    private LocalDateTime createdAt;
    
    // User context
    private Boolean userOwns;
    private Boolean userCanAfford;

    // Default constructor
    public StoreItemResponseDto() {}

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public StoreItem.ItemType getItemType() {
        return itemType;
    }

    public void setItemType(StoreItem.ItemType itemType) {
        this.itemType = itemType;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public StoreItem.ItemCategory getCategory() {
        return category;
    }

    public void setCategory(StoreItem.ItemCategory category) {
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public StoreItem.Rarity getRarity() {
        return rarity;
    }

    public void setRarity(StoreItem.Rarity rarity) {
        this.rarity = rarity;
    }

    public String getRarityColor() {
        return rarityColor;
    }

    public void setRarityColor(String rarityColor) {
        this.rarityColor = rarityColor;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getUserOwns() {
        return userOwns;
    }

    public void setUserOwns(Boolean userOwns) {
        this.userOwns = userOwns;
    }

    public Boolean getUserCanAfford() {
        return userCanAfford;
    }

    public void setUserCanAfford(Boolean userCanAfford) {
        this.userCanAfford = userCanAfford;
    }

    /**
     * Creates a StoreItemResponseDto from a StoreItem entity.
     */
    public static StoreItemResponseDto fromEntity(StoreItem item) {
        StoreItemResponseDto dto = new StoreItemResponseDto();
        dto.setId(item.getId());
        dto.setItemType(item.getItemType());
        dto.setName(item.getName());
        dto.setShortDescription(item.getShortDescription());
        dto.setDescription(item.getDescription());
        dto.setCategory(item.getCategory());
        dto.setIconUrl(item.getIconUrl());
        dto.setPreviewData(item.getPreviewData());
        dto.setPrice(item.getPrice());
        dto.setRarity(item.getRarity());
        dto.setRarityColor(item.getRarityColor());
        dto.setIsActive(item.getIsActive());
        dto.setIsFeatured(item.getIsFeatured());
        dto.setIsLimitedTime(item.getIsLimitedTime());
        dto.setAvailableUntil(item.getAvailableUntil());
        dto.setCreatedAt(item.getCreatedAt());
        // User context fields set to null by default
        dto.setUserOwns(null);
        dto.setUserCanAfford(null);
        return dto;
    }
}
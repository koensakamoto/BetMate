package com.rivalpicks.dto.betting.response;

import com.rivalpicks.entity.user.UserInventory;

/**
 * Response DTO for available insurance items in user's inventory.
 * Lists insurance cards that can be applied to bets.
 */
public class AvailableInsuranceResponseDto {

    private Long inventoryId;
    private Long storeItemId;
    private String itemName;
    private Integer refundPercentage;
    private String tier;
    private Integer usesRemaining;
    private boolean isActive;

    // Constructors
    public AvailableInsuranceResponseDto() {}

    public AvailableInsuranceResponseDto(Long inventoryId, Long storeItemId, String itemName,
                                        Integer refundPercentage, String tier,
                                        Integer usesRemaining, boolean isActive) {
        this.inventoryId = inventoryId;
        this.storeItemId = storeItemId;
        this.itemName = itemName;
        this.refundPercentage = refundPercentage;
        this.tier = tier;
        this.usesRemaining = usesRemaining;
        this.isActive = isActive;
    }

    // Getters and setters
    public Long getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Long inventoryId) {
        this.inventoryId = inventoryId;
    }

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

    public Integer getRefundPercentage() {
        return refundPercentage;
    }

    public void setRefundPercentage(Integer refundPercentage) {
        this.refundPercentage = refundPercentage;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public Integer getUsesRemaining() {
        return usesRemaining;
    }

    public void setUsesRemaining(Integer usesRemaining) {
        this.usesRemaining = usesRemaining;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    // Helper method to convert from entity
    public static AvailableInsuranceResponseDto fromInventory(UserInventory inventory,
                                                             Integer refundPercentage,
                                                             String tier) {
        AvailableInsuranceResponseDto dto = new AvailableInsuranceResponseDto();

        dto.setInventoryId(inventory.getId());
        dto.setStoreItemId(inventory.getStoreItem().getId());
        dto.setItemName(inventory.getStoreItem().getName());
        dto.setRefundPercentage(refundPercentage);
        dto.setTier(tier);
        dto.setUsesRemaining(inventory.getUsesRemaining());
        dto.setActive(inventory.getIsActive());

        return dto;
    }
}

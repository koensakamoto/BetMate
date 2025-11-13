package com.betmate.dto.betting.response;

import com.betmate.entity.store.StoreItem;
import com.betmate.entity.user.UserInventory;

import java.util.List;

/**
 * Response DTO containing inventory item details and list of eligible bets.
 * Used when displaying which bets can have a specific inventory item applied.
 */
public class InventoryItemWithEligibleBetsResponseDto {

    private Long inventoryId;
    private Long storeItemId;
    private String itemName;
    private StoreItem.ItemType itemType;
    private String description;
    private Integer usesRemaining;
    private boolean isActive;
    private List<EligibleBetResponseDto> eligibleBets;

    // Constructors
    public InventoryItemWithEligibleBetsResponseDto() {}

    public InventoryItemWithEligibleBetsResponseDto(Long inventoryId, Long storeItemId,
                                                    String itemName, StoreItem.ItemType itemType,
                                                    String description, Integer usesRemaining,
                                                    boolean isActive,
                                                    List<EligibleBetResponseDto> eligibleBets) {
        this.inventoryId = inventoryId;
        this.storeItemId = storeItemId;
        this.itemName = itemName;
        this.itemType = itemType;
        this.description = description;
        this.usesRemaining = usesRemaining;
        this.isActive = isActive;
        this.eligibleBets = eligibleBets;
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

    public StoreItem.ItemType getItemType() {
        return itemType;
    }

    public void setItemType(StoreItem.ItemType itemType) {
        this.itemType = itemType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public List<EligibleBetResponseDto> getEligibleBets() {
        return eligibleBets;
    }

    public void setEligibleBets(List<EligibleBetResponseDto> eligibleBets) {
        this.eligibleBets = eligibleBets;
    }

    /**
     * Helper method to create DTO from UserInventory and list of eligible bets.
     *
     * @param inventory The user inventory item
     * @param eligibleBets List of eligible bets for this item
     * @return The DTO representation
     */
    public static InventoryItemWithEligibleBetsResponseDto fromInventory(
            UserInventory inventory,
            List<EligibleBetResponseDto> eligibleBets) {

        InventoryItemWithEligibleBetsResponseDto dto = new InventoryItemWithEligibleBetsResponseDto();

        dto.setInventoryId(inventory.getId());
        dto.setStoreItemId(inventory.getStoreItem().getId());
        dto.setItemName(inventory.getStoreItem().getName());
        dto.setItemType(inventory.getStoreItem().getItemType());
        dto.setDescription(inventory.getStoreItem().getDescription());
        dto.setUsesRemaining(inventory.getUsesRemaining());
        dto.setActive(inventory.getIsActive());
        dto.setEligibleBets(eligibleBets);

        return dto;
    }
}

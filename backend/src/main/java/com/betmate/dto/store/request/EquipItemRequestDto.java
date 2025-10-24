package com.betmate.dto.store.request;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for equipping inventory items.
 * Contains validation for equip operations.
 */
public class EquipItemRequestDto {
    
    @NotNull(message = "Inventory ID is required")
    private Long inventoryId;

    // Default constructor
    public EquipItemRequestDto() {}

    // Constructor
    public EquipItemRequestDto(Long inventoryId) {
        this.inventoryId = inventoryId;
    }

    // Getters and setters
    public Long getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Long inventoryId) {
        this.inventoryId = inventoryId;
    }
}
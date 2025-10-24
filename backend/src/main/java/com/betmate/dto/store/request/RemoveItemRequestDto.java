package com.betmate.dto.store.request;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for removing inventory items.
 * Contains validation for remove operations.
 */
public class RemoveItemRequestDto {
    
    @NotNull(message = "Inventory ID is required")
    private Long inventoryId;

    // Default constructor
    public RemoveItemRequestDto() {}

    // Constructor
    public RemoveItemRequestDto(Long inventoryId) {
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
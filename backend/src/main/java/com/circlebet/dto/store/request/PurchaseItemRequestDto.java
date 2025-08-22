package com.circlebet.dto.store.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Request DTO for purchasing store items.
 * Contains validation for purchase operations.
 */
public class PurchaseItemRequestDto {
    
    @NotNull(message = "Store item ID is required")
    private Long storeItemId;
    
    @NotNull(message = "Price paid is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal pricePaid;

    // Default constructor
    public PurchaseItemRequestDto() {}

    // Constructor
    public PurchaseItemRequestDto(Long storeItemId, BigDecimal pricePaid) {
        this.storeItemId = storeItemId;
        this.pricePaid = pricePaid;
    }

    // Getters and setters
    public Long getStoreItemId() {
        return storeItemId;
    }

    public void setStoreItemId(Long storeItemId) {
        this.storeItemId = storeItemId;
    }

    public BigDecimal getPricePaid() {
        return pricePaid;
    }

    public void setPricePaid(BigDecimal pricePaid) {
        this.pricePaid = pricePaid;
    }
}
package com.circlebet.dto.store.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for inventory summary information.
 * Provides an overview of user's inventory statistics.
 */
public class InventorySummaryResponseDto {
    
    private Long totalItems;
    private BigDecimal totalValue;
    private Map<String, Long> itemsByType;
    private List<InventoryItemResponseDto> recentPurchases;

    // Default constructor
    public InventorySummaryResponseDto() {}

    // Constructor
    public InventorySummaryResponseDto(Long totalItems, BigDecimal totalValue, 
                                  Map<String, Long> itemsByType, 
                                  List<InventoryItemResponseDto> recentPurchases) {
        this.totalItems = totalItems;
        this.totalValue = totalValue;
        this.itemsByType = itemsByType;
        this.recentPurchases = recentPurchases;
    }

    // Getters and setters
    public Long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Long totalItems) {
        this.totalItems = totalItems;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public Map<String, Long> getItemsByType() {
        return itemsByType;
    }

    public void setItemsByType(Map<String, Long> itemsByType) {
        this.itemsByType = itemsByType;
    }

    public List<InventoryItemResponseDto> getRecentPurchases() {
        return recentPurchases;
    }

    public void setRecentPurchases(List<InventoryItemResponseDto> recentPurchases) {
        this.recentPurchases = recentPurchases;
    }
}
package com.betmate.service.store;

import com.betmate.entity.store.StoreItem;
import com.betmate.entity.user.UserInventory;
import com.betmate.exception.store.StoreManagementException;
import com.betmate.repository.store.StoreItemRepository;
import com.betmate.repository.user.UserInventoryRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for administrative store management operations.
 * Handles item lifecycle, promotions, and store analytics.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class StoreManagementService {

    private final StoreItemRepository storeItemRepository;
    private final UserInventoryRepository userInventoryRepository;

    @Autowired
    public StoreManagementService(StoreItemRepository storeItemRepository,
                                 UserInventoryRepository userInventoryRepository) {
        this.storeItemRepository = storeItemRepository;
        this.userInventoryRepository = userInventoryRepository;
    }

    // ==========================================
    // ITEM LIFECYCLE MANAGEMENT
    // ==========================================

    /**
     * Creates a new store item with validation.
     */
    @Transactional
    public StoreItem createStoreItem(@NotNull StoreItemCreationRequest request) {
        // Validate item creation
        validateItemCreation(request);
        
        StoreItem item = new StoreItem();
        item.setItemType(request.itemType());
        item.setName(request.name());
        item.setDescription(request.description());
        item.setCategory(request.category());
        item.setIconUrl(request.iconUrl());
        item.setPreviewData(request.previewData());
        item.setPrice(request.price());
        item.setRarity(request.rarity());
        item.setIsActive(request.isActive() != null ? request.isActive() : true);
        item.setIsFeatured(request.isFeatured() != null ? request.isFeatured() : false);
        item.setIsLimitedTime(request.isLimitedTime() != null ? request.isLimitedTime() : false);
        item.setAvailableUntil(request.availableUntil());
        item.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        
        return storeItemRepository.save(item);
    }

    /**
     * Bulk creates multiple store items.
     */
    @Transactional
    public List<StoreItem> createStoreItems(@NotNull List<StoreItemCreationRequest> requests) {
        return requests.stream()
            .map(this::createStoreItem)
            .collect(Collectors.toList());
    }

    /**
     * Archives a store item (soft delete).
     */
    @Transactional
    public void archiveStoreItem(@NotNull Long itemId) {
        StoreItem item = getStoreItem(itemId);
        item.setIsActive(false);
        storeItemRepository.save(item);
    }

    /**
     * Restores an archived store item.
     */
    @Transactional
    public void restoreStoreItem(@NotNull Long itemId) {
        StoreItem item = getStoreItem(itemId);
        
        // Validate that limited time item hasn't expired
        if (item.getIsLimitedTime() && item.getAvailableUntil() != null 
            && item.getAvailableUntil().isBefore(LocalDateTime.now())) {
            throw new StoreManagementException("Cannot restore expired limited-time item");
        }
        
        item.setIsActive(true);
        storeItemRepository.save(item);
    }

    // ==========================================
    // PROMOTIONS & FEATURED ITEMS
    // ==========================================

    /**
     * Sets featured status for multiple items.
     */
    @Transactional
    public void updateFeaturedItems(@NotNull List<Long> itemIds, boolean featured) {
        List<StoreItem> items = storeItemRepository.findAllById(itemIds);
        
        for (StoreItem item : items) {
            item.setIsFeatured(featured);
        }
        
        storeItemRepository.saveAll(items);
    }

    /**
     * Creates a limited-time promotion for an item.
     */
    @Transactional
    public void createLimitedTimePromotion(@NotNull Long itemId, @NotNull LocalDateTime endTime, 
                                          BigDecimal promotionPrice) {
        StoreItem item = getStoreItem(itemId);
        
        if (endTime.isBefore(LocalDateTime.now())) {
            throw new StoreManagementException("Promotion end time cannot be in the past");
        }
        
        item.setIsLimitedTime(true);
        item.setAvailableUntil(endTime);
        item.setIsFeatured(true);
        
        if (promotionPrice != null) {
            item.setPrice(promotionPrice);
        }
        
        storeItemRepository.save(item);
    }

    /**
     * Processes expired promotions automatically.
     */
    @Transactional
    public void processExpiredPromotions() {
        List<StoreItem> expiredItems = storeItemRepository.findExpiredLimitedTimeItems(LocalDateTime.now());
        
        for (StoreItem item : expiredItems) {
            item.setIsActive(false);
            item.setIsFeatured(false);
        }
        
        storeItemRepository.saveAll(expiredItems);
    }

    // ==========================================
    // INVENTORY MANAGEMENT
    // ==========================================

    /**
     * Gets all users who own a specific item.
     */
    public List<UserInventory> getUsersWhoOwnItem(@NotNull Long itemId) {
        StoreItem item = getStoreItem(itemId);
        return userInventoryRepository.findByStoreItemAndIsActiveTrue(item);
    }

    /**
     * Gets inventory statistics for an item.
     */
    public ItemInventoryStats getItemInventoryStats(@NotNull Long itemId) {
        StoreItem item = getStoreItem(itemId);
        
        Long totalOwners = userInventoryRepository.countOwnersByItem(item);
        BigDecimal totalRevenue = userInventoryRepository.getTotalRevenueByItem(item);
        
        return new ItemInventoryStats(item.getId(), item.getName(), totalOwners, totalRevenue);
    }

    // ==========================================
    // ANALYTICS & REPORTING
    // ==========================================

    /**
     * Gets comprehensive store analytics.
     */
    public StoreAnalyticsReport getStoreAnalyticsReport() {
        // Basic stats
        Long totalActiveItems = storeItemRepository.countActiveItems();
        BigDecimal totalRevenue = userInventoryRepository.getTotalRevenue();
        
        // Category distribution
        List<Object[]> categoryStats = storeItemRepository.getItemCountByCategory();
        Map<StoreItem.ItemCategory, Long> categoryDistribution = categoryStats.stream()
            .collect(Collectors.toMap(
                row -> (StoreItem.ItemCategory) row[0],
                row -> (Long) row[1]
            ));
        
        // Rarity distribution
        List<Object[]> rarityStats = storeItemRepository.getItemCountByRarity();
        Map<StoreItem.Rarity, Long> rarityDistribution = rarityStats.stream()
            .collect(Collectors.toMap(
                row -> (StoreItem.Rarity) row[0],
                row -> (Long) row[1]
            ));
        
        // Popular items
        List<Object[]> popularItems = userInventoryRepository.getMostPopularItems();
        
        return new StoreAnalyticsReport(
            totalActiveItems,
            totalRevenue,
            categoryDistribution,
            rarityDistribution,
            popularItems
        );
    }

    /**
     * Gets sales report for a time period.
     */
    public SalesReport getSalesReport(@NotNull LocalDateTime startDate, @NotNull LocalDateTime endDate) {
        List<UserInventory> sales = userInventoryRepository.findPurchasesBetween(startDate, endDate);
        
        BigDecimal totalRevenue = sales.stream()
            .map(UserInventory::getPurchasePrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Map<StoreItem.ItemType, Long> salesByType = sales.stream()
            .collect(Collectors.groupingBy(
                inventory -> inventory.getStoreItem().getItemType(),
                Collectors.counting()
            ));
        
        return new SalesReport(sales.size(), totalRevenue, salesByType, startDate, endDate);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private StoreItem getStoreItem(Long itemId) {
        return storeItemRepository.findById(itemId)
            .orElseThrow(() -> new StoreManagementException("Store item not found: " + itemId));
    }

    private void validateItemCreation(StoreItemCreationRequest request) {
        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new StoreManagementException("Item name is required");
        }
        
        if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) <= 0) {
            throw new StoreManagementException("Price must be greater than 0");
        }
        
        if (request.isLimitedTime() != null && request.isLimitedTime() && request.availableUntil() == null) {
            throw new StoreManagementException("Limited time items must have an end date");
        }
        
        if (request.availableUntil() != null && request.availableUntil().isBefore(LocalDateTime.now())) {
            throw new StoreManagementException("Available until date cannot be in the past");
        }
    }

    // ==========================================
    // DTOs
    // ==========================================

    public record StoreItemCreationRequest(
        @NotNull StoreItem.ItemType itemType,
        @NotNull String name,
        String description,
        @NotNull StoreItem.ItemCategory category,
        String iconUrl,
        String previewData,
        @NotNull BigDecimal price,
        @NotNull StoreItem.Rarity rarity,
        Boolean isActive,
        Boolean isFeatured,
        Boolean isLimitedTime,
        LocalDateTime availableUntil,
        Integer sortOrder
    ) {}

    public record ItemInventoryStats(
        Long itemId,
        String itemName,
        Long totalOwners,
        BigDecimal totalRevenue
    ) {}

    public record StoreAnalyticsReport(
        Long totalActiveItems,
        BigDecimal totalRevenue,
        Map<StoreItem.ItemCategory, Long> categoryDistribution,
        Map<StoreItem.Rarity, Long> rarityDistribution,
        List<Object[]> mostPopularItems
    ) {}

    public record SalesReport(
        Integer totalSales,
        BigDecimal totalRevenue,
        Map<StoreItem.ItemType, Long> salesByType,
        LocalDateTime startDate,
        LocalDateTime endDate
    ) {}

    // ==========================================
    // EXCEPTIONS
    // ==========================================

}
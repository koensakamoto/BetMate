package com.betmate.service.store;

import com.betmate.entity.store.StoreItem;
import com.betmate.entity.user.User;
import com.betmate.entity.user.UserInventory;
import com.betmate.repository.store.StoreItemRepository;
import com.betmate.repository.user.UserInventoryRepository;
import com.betmate.exception.store.StoreItemNotFoundException;
import com.betmate.exception.store.StoreOperationException;
import com.betmate.service.bet.InsuranceService;
import com.betmate.service.user.UserCreditService;
import com.betmate.service.user.ActiveEffectsService;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing store operations including browsing items,
 * purchasing, and store analytics.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class StoreService {

    private final StoreItemRepository storeItemRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final UserCreditService userCreditService;
    private final ActiveEffectsService activeEffectsService;
    private final InsuranceService insuranceService;

    @Autowired
    public StoreService(StoreItemRepository storeItemRepository,
                       UserInventoryRepository userInventoryRepository,
                       UserCreditService userCreditService,
                       ActiveEffectsService activeEffectsService,
                       @Lazy InsuranceService insuranceService) {
        this.storeItemRepository = storeItemRepository;
        this.userInventoryRepository = userInventoryRepository;
        this.userCreditService = userCreditService;
        this.activeEffectsService = activeEffectsService;
        this.insuranceService = insuranceService;
    }

    // ==========================================
    // STORE BROWSING
    // ==========================================

    /**
     * Gets all available items for purchase.
     */
    public List<StoreItem> getAvailableItems() {
        return storeItemRepository.findAvailableItems(LocalDateTime.now());
    }

    /**
     * Gets featured items for the store front page.
     */
    public List<StoreItem> getFeaturedItems() {
        return storeItemRepository.findByIsActiveTrueAndIsFeaturedTrue();
    }

    /**
     * Gets items by category, sorted by display order.
     */
    public List<StoreItem> getItemsByCategory(@NotNull StoreItem.ItemCategory category) {
        return storeItemRepository.findByCategoryAndIsActiveTrueOrderBySortOrder(category);
    }

    /**
     * Gets items by type.
     */
    public List<StoreItem> getItemsByType(@NotNull StoreItem.ItemType itemType) {
        return storeItemRepository.findByItemType(itemType);
    }

    /**
     * Gets items by rarity level.
     */
    public List<StoreItem> getItemsByRarity(@NotNull StoreItem.Rarity rarity) {
        return storeItemRepository.findByRarity(rarity);
    }

    /**
     * Gets items within a price range.
     */
    public List<StoreItem> getItemsByPriceRange(@NotNull BigDecimal minPrice, @NotNull BigDecimal maxPrice) {
        return storeItemRepository.findByPriceBetween(minPrice, maxPrice);
    }

    /**
     * Searches items by name or description.
     */
    public List<StoreItem> searchItems(@NotNull String searchTerm) {
        if (searchTerm.trim().isEmpty()) {
            return getAvailableItems();
        }
        return storeItemRepository.searchItems(searchTerm.trim());
    }

    /**
     * Gets limited time items that are still available.
     */
    public List<StoreItem> getLimitedTimeItems() {
        return storeItemRepository.findByIsLimitedTimeTrueAndAvailableUntilAfter(LocalDateTime.now());
    }

    // ==========================================
    // ITEM DETAILS
    // ==========================================

    /**
     * Gets a store item by ID.
     */
    public StoreItem getStoreItem(@NotNull Long itemId) {
        return storeItemRepository.findById(itemId)
            .orElseThrow(() -> new StoreItemNotFoundException("Store item not found: " + itemId));
    }

    /**
     * Checks if an item is available for purchase.
     */
    public boolean isItemAvailableForPurchase(@NotNull Long itemId) {
        StoreItem item = getStoreItem(itemId);
        return item.isAvailableForPurchase();
    }

    /**
     * Checks if a user already owns an item.
     */
    public boolean doesUserOwnItem(@NotNull User user, @NotNull Long itemId) {
        StoreItem item = getStoreItem(itemId);
        return userInventoryRepository.existsByUserAndStoreItemAndIsActiveTrue(user, item);
    }

    // ==========================================
    // PURCHASING
    // ==========================================

    /**
     * Purchases an item for a user.
     */
    @Transactional
    public UserInventory purchaseItem(@NotNull User user, @NotNull Long itemId, @NotNull BigDecimal pricePaid) {
        StoreItem item = getStoreItem(itemId);

        // Validate purchase
        validatePurchase(user, item, pricePaid);

        // Deduct credits from user's balance
        String reason = "Store purchase: " + item.getName();
        userCreditService.deductCredits(user.getId(), pricePaid, reason);

        // Create inventory entry using the static factory method
        UserInventory inventory = UserInventory.createPurchase(user, item, pricePaid);
        UserInventory savedInventory = userInventoryRepository.save(inventory);

        // Auto-activate daily bonus doublers
        if (item.getItemType() == StoreItem.ItemType.DAILY_BOOSTER) {
            activeEffectsService.activateDailyDoubler(user, savedInventory);
        }

        // Initialize insurance items with 1 use
        if (item.getItemType() == StoreItem.ItemType.BASIC_INSURANCE ||
            item.getItemType() == StoreItem.ItemType.PREMIUM_INSURANCE ||
            item.getItemType() == StoreItem.ItemType.ELITE_INSURANCE) {
            // Set usesRemaining=1, isActive=true, activatedAt=now
            savedInventory.activateBooster(1);
            savedInventory = userInventoryRepository.save(savedInventory);
        }

        return savedInventory;
    }

    /**
     * Validates if a purchase can be made.
     */
    private void validatePurchase(User user, StoreItem item, BigDecimal pricePaid) {
        // Check if item is available
        if (!item.isAvailableForPurchase()) {
            throw new StoreOperationException("Item is not available for purchase");
        }

        // Check if user already owns the item
        if (doesUserOwnItem(user, item.getId())) {
            throw new StoreOperationException("User already owns this item");
        }

        // Prevent purchasing daily doubler if user already has one active
        if (item.getItemType() == StoreItem.ItemType.DAILY_BOOSTER) {
            if (activeEffectsService.hasActiveDailyDoubler(user)) {
                throw new StoreOperationException("You already have an active daily bonus doubler. Wait for it to expire before purchasing another.");
            }
        }

        // Prevent purchasing insurance if user already has one active of the same tier
        if (item.getItemType() == StoreItem.ItemType.BASIC_INSURANCE ||
            item.getItemType() == StoreItem.ItemType.PREMIUM_INSURANCE ||
            item.getItemType() == StoreItem.ItemType.ELITE_INSURANCE) {

            String tier = insuranceService.getInsuranceTierName(item.getItemType());
            if (!insuranceService.getActiveInsuranceByTier(user, tier).isEmpty()) {
                throw new StoreOperationException("You already have active " + tier.toLowerCase() +
                    " insurance. Use it before purchasing another.");
            }
        }

        // Validate price
        if (pricePaid.compareTo(item.getPrice()) != 0) {
            throw new StoreOperationException("Price mismatch. Expected: " + item.getPrice() + ", Provided: " + pricePaid);
        }

        // TODO: Check user balance when user credit system is implemented
        // if (user.getBalance().compareTo(pricePaid) < 0) {
        //     throw new StoreOperationException("Insufficient balance");
        // }
    }

    // ==========================================
    // STORE MANAGEMENT
    // ==========================================

    /**
     * Creates a new store item.
     */
    @Transactional
    public StoreItem createStoreItem(@NotNull StoreItem item) {
        // Set default values
        if (item.getSortOrder() == null) {
            item.setSortOrder(0);
        }
        
        return storeItemRepository.save(item);
    }

    /**
     * Updates an existing store item.
     */
    @Transactional
    public StoreItem updateStoreItem(@NotNull Long itemId, @NotNull StoreItemUpdateRequest request) {
        StoreItem item = getStoreItem(itemId);
        
        if (request.name() != null) {
            item.setName(request.name());
        }
        if (request.description() != null) {
            item.setDescription(request.description());
        }
        if (request.price() != null) {
            item.setPrice(request.price());
        }
        if (request.isActive() != null) {
            item.setIsActive(request.isActive());
        }
        if (request.isFeatured() != null) {
            item.setIsFeatured(request.isFeatured());
        }
        if (request.sortOrder() != null) {
            item.setSortOrder(request.sortOrder());
        }
        
        return storeItemRepository.save(item);
    }

    /**
     * Deactivates a store item.
     */
    @Transactional
    public void deactivateStoreItem(@NotNull Long itemId) {
        StoreItem item = getStoreItem(itemId);
        item.setIsActive(false);
        storeItemRepository.save(item);
    }

    /**
     * Updates featured status of an item.
     */
    @Transactional
    public void setFeaturedStatus(@NotNull Long itemId, boolean featured) {
        StoreItem item = getStoreItem(itemId);
        item.setIsFeatured(featured);
        storeItemRepository.save(item);
    }

    // ==========================================
    // ANALYTICS & REPORTS
    // ==========================================

    /**
     * Gets store analytics summary.
     */
    public StoreAnalytics getStoreAnalytics() {
        Long totalItems = storeItemRepository.countActiveItems();
        List<Object[]> categoryStats = storeItemRepository.getItemCountByCategory();
        List<Object[]> rarityStats = storeItemRepository.getItemCountByRarity();
        
        Map<StoreItem.ItemCategory, Long> categoryDistribution = categoryStats.stream()
            .collect(Collectors.toMap(
                row -> (StoreItem.ItemCategory) row[0],
                row -> (Long) row[1]
            ));
        
        Map<StoreItem.Rarity, Long> rarityDistribution = rarityStats.stream()
            .collect(Collectors.toMap(
                row -> (StoreItem.Rarity) row[0],
                row -> (Long) row[1]
            ));
        
        return new StoreAnalytics(totalItems, categoryDistribution, rarityDistribution);
    }

    /**
     * Gets most popular items based on purchase count.
     */
    public List<Object[]> getMostPopularItems() {
        return userInventoryRepository.getMostPopularItems();
    }

    /**
     * Gets total revenue from store sales.
     */
    public BigDecimal getTotalRevenue() {
        return userInventoryRepository.getTotalRevenue();
    }

    /**
     * Processes expired limited-time items.
     */
    @Transactional
    public void processExpiredLimitedTimeItems() {
        List<StoreItem> expiredItems = storeItemRepository.findExpiredLimitedTimeItems(LocalDateTime.now());
        
        for (StoreItem item : expiredItems) {
            item.setIsActive(false);
            storeItemRepository.save(item);
        }
    }

    // ==========================================
    // DTOs
    // ==========================================

    public record StoreItemUpdateRequest(
        String name,
        String description,
        BigDecimal price,
        Boolean isActive,
        Boolean isFeatured,
        Integer sortOrder
    ) {}

    public record StoreAnalytics(
        Long totalActiveItems,
        Map<StoreItem.ItemCategory, Long> categoryDistribution,
        Map<StoreItem.Rarity, Long> rarityDistribution
    ) {}

}
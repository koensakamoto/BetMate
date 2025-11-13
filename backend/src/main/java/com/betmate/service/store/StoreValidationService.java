package com.betmate.service.store;

import com.betmate.entity.store.StoreItem;
import com.betmate.entity.user.User;
import com.betmate.entity.user.UserInventory;
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

/**
 * Service for validating store operations and enforcing business rules.
 * Centralizes all store-related validation logic.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class StoreValidationService {

    private final StoreItemRepository storeItemRepository;
    private final UserInventoryRepository userInventoryRepository;

    @Autowired
    public StoreValidationService(StoreItemRepository storeItemRepository,
                                 UserInventoryRepository userInventoryRepository) {
        this.storeItemRepository = storeItemRepository;
        this.userInventoryRepository = userInventoryRepository;
    }

    // ==========================================
    // PURCHASE VALIDATION
    // ==========================================

    /**
     * Validates if a user can purchase an item.
     */
    public PurchaseValidationResult validatePurchase(@NotNull User user, @NotNull Long itemId, @NotNull BigDecimal pricePaid) {
        StoreItem item = storeItemRepository.findById(itemId).orElse(null);
        
        if (item == null) {
            return PurchaseValidationResult.failure("Store item not found");
        }
        
        // Check if item is active
        if (!item.getIsActive()) {
            return PurchaseValidationResult.failure("Item is not available for purchase");
        }
        
        // Check if item is available (not expired)
        if (!item.isAvailableForPurchase()) {
            return PurchaseValidationResult.failure("Item is no longer available");
        }
        
        // Check if user already owns the item
        if (userInventoryRepository.existsByUserAndStoreItemAndIsActiveTrue(user, item)) {
            return PurchaseValidationResult.failure("You already own this item");
        }
        
        // Validate price
        if (pricePaid.compareTo(item.getPrice()) != 0) {
            return PurchaseValidationResult.failure(
                String.format("Price mismatch. Expected: %s, Provided: %s", 
                item.getPrice(), pricePaid)
            );
        }
        
        // Check for item-specific restrictions
        ValidationResult itemSpecificValidation = validateItemSpecificRules(user, item);
        if (!itemSpecificValidation.isValid()) {
            return PurchaseValidationResult.failure(itemSpecificValidation.getErrorMessage());
        }
        
        // TODO: Add balance validation when user credit system is implemented
        // if (user.getBalance().compareTo(pricePaid) < 0) {
        //     return PurchaseValidationResult.failure("Insufficient balance");
        // }
        
        return PurchaseValidationResult.success();
    }

    /**
     * Validates item-specific business rules.
     */
    private ValidationResult validateItemSpecificRules(User user, StoreItem item) {
        switch (item.getItemType()) {
            case TITLE -> {
                // Users can own multiple titles
                return ValidationResult.success();
            }
            case BADGE -> {
                // Users can own multiple badges
                return ValidationResult.success();
            }
            case AVATAR_SKIN, PROFILE_THEME, PROFILE_FRAME -> {
                // Users can own multiple customization items
                return ValidationResult.success();
            }
            case ROAST_CARD_PACK, TAUNT_COLLECTION -> {
                // Check if user already has too many social items
                long socialItemCount = userInventoryRepository
                    .countByUserAndStoreItem_CategoryAndIsActiveTrue(user, StoreItem.ItemCategory.SOCIAL);
                
                if (socialItemCount >= 50) { // Business rule: max 50 social items
                    return ValidationResult.failure("Maximum social items limit reached (50)");
                }
                
                return ValidationResult.success();
            }
            case EMOJI_PACK, CHAT_EFFECT -> {
                // Check emoji/chat effect limits
                long customizationCount = userInventoryRepository
                    .countByUserAndStoreItem_CategoryAndIsActiveTrue(user, StoreItem.ItemCategory.CUSTOMIZATION);
                
                if (customizationCount >= 100) { // Business rule: max 100 customization items
                    return ValidationResult.failure("Maximum customization items limit reached (100)");
                }
                
                return ValidationResult.success();
            }
            default -> {
                return ValidationResult.success();
            }
        }
    }

    // ==========================================
    // EQUIPMENT VALIDATION
    // ==========================================

    /**
     * Validates if a user can equip an item.
     */
    public ValidationResult validateEquipment(@NotNull User user, @NotNull Long inventoryId) {
        UserInventory inventory = userInventoryRepository.findById(inventoryId).orElse(null);
        
        if (inventory == null) {
            return ValidationResult.failure("Inventory item not found");
        }
        
        if (!inventory.getUser().getId().equals(user.getId())) {
            return ValidationResult.failure("You don't own this item");
        }
        
        if (!inventory.getIsActive()) {
            return ValidationResult.failure("Item is not active");
        }
        
        if (inventory.getIsEquipped()) {
            return ValidationResult.failure("Item is already equipped");
        }
        
        // Check if user can equip this type of item
        StoreItem.ItemType itemType = inventory.getStoreItem().getItemType();
        if (!isEquippableItemType(itemType)) {
            return ValidationResult.failure("This item type cannot be equipped");
        }
        
        // Check if user already has an item of this type equipped
        boolean hasEquippedItemOfType = userInventoryRepository
            .findEquippedItemByType(user, itemType)
            .isPresent();
        
        if (hasEquippedItemOfType) {
            return ValidationResult.failure("You already have a " + itemType.name().toLowerCase() + " equipped");
        }
        
        return ValidationResult.success();
    }

    /**
     * Checks if an item type can be equipped.
     */
    private boolean isEquippableItemType(StoreItem.ItemType itemType) {
        return switch (itemType) {
            case TITLE, BADGE, AVATAR_SKIN, PROFILE_THEME, PROFILE_FRAME -> true;
            case ROAST_CARD_PACK, TAUNT_COLLECTION, EMOJI_PACK, CHAT_EFFECT,
                 BET_INSURANCE, BASIC_INSURANCE, PREMIUM_INSURANCE, ELITE_INSURANCE,
                 FREEZE_CARD, HEDGE_HELPER, MULLIGAN_TOKEN,
                 MULTIPLIER, CREDIT_BOOSTER, TIME_EXTENSION, SURE_SHOT,
                 SIDE_BET_CREATOR, DISCOUNT_TICKET, VIP_PASS,
                 DAILY_BOOSTER, CHALLENGE_BOOSTER, REFERRAL_BOOSTER -> false;
        };
    }

    // ==========================================
    // STORE MANAGEMENT VALIDATION
    // ==========================================

    /**
     * Validates store item creation.
     */
    public ValidationResult validateStoreItemCreation(@NotNull StoreService.StoreItemUpdateRequest request) {
        if (request.name() == null || request.name().trim().isEmpty()) {
            return ValidationResult.failure("Item name is required");
        }
        
        if (request.name().length() > 100) {
            return ValidationResult.failure("Item name cannot exceed 100 characters");
        }
        
        if (request.description() != null && request.description().length() > 500) {
            return ValidationResult.failure("Description cannot exceed 500 characters");
        }
        
        if (request.price() != null && request.price().compareTo(BigDecimal.ZERO) <= 0) {
            return ValidationResult.failure("Price must be greater than 0");
        }
        
        if (request.price() != null && request.price().compareTo(new BigDecimal("10000")) > 0) {
            return ValidationResult.failure("Price cannot exceed 10,000 credits");
        }
        
        return ValidationResult.success();
    }

    /**
     * Validates limited-time promotion setup.
     */
    public ValidationResult validatePromotionSetup(@NotNull Long itemId, @NotNull LocalDateTime endTime, 
                                                  BigDecimal promotionPrice) {
        StoreItem item = storeItemRepository.findById(itemId).orElse(null);
        
        if (item == null) {
            return ValidationResult.failure("Store item not found");
        }
        
        if (!item.getIsActive()) {
            return ValidationResult.failure("Cannot create promotion for inactive item");
        }
        
        if (endTime.isBefore(LocalDateTime.now().plusHours(1))) {
            return ValidationResult.failure("Promotion must last at least 1 hour");
        }
        
        if (endTime.isAfter(LocalDateTime.now().plusDays(30))) {
            return ValidationResult.failure("Promotion cannot last more than 30 days");
        }
        
        if (promotionPrice != null) {
            if (promotionPrice.compareTo(BigDecimal.ZERO) <= 0) {
                return ValidationResult.failure("Promotion price must be greater than 0");
            }
            
            if (promotionPrice.compareTo(item.getPrice()) >= 0) {
                return ValidationResult.failure("Promotion price must be less than original price");
            }
        }
        
        return ValidationResult.success();
    }

    // ==========================================
    // BUSINESS RULES VALIDATION
    // ==========================================

    /**
     * Validates daily purchase limits for a user.
     */
    public ValidationResult validateDailyPurchaseLimit(@NotNull User user) {
        LocalDateTime dayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        List<UserInventory> todaysPurchases = userInventoryRepository
            .findByUserAndPurchasedAtAfter(user, dayStart);
        
        if (todaysPurchases.size() >= 20) { // Business rule: max 20 purchases per day
            return ValidationResult.failure("Daily purchase limit reached (20)");
        }
        
        BigDecimal todaysSpending = todaysPurchases.stream()
            .map(UserInventory::getPurchasePrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (todaysSpending.compareTo(new BigDecimal("1000")) >= 0) { // Business rule: max 1000 credits per day
            return ValidationResult.failure("Daily spending limit reached (1000 credits)");
        }
        
        return ValidationResult.success();
    }

    /**
     * Validates if a rarity upgrade is allowed.
     */
    public ValidationResult validateRarityUpgrade(@NotNull StoreItem.Rarity fromRarity, 
                                                 @NotNull StoreItem.Rarity toRarity) {
        int fromOrder = getRarityOrder(fromRarity);
        int toOrder = getRarityOrder(toRarity);
        
        if (toOrder <= fromOrder) {
            return ValidationResult.failure("Can only upgrade to higher rarity");
        }
        
        if (toOrder - fromOrder > 1) {
            return ValidationResult.failure("Can only upgrade by one rarity level at a time");
        }
        
        return ValidationResult.success();
    }

    private int getRarityOrder(StoreItem.Rarity rarity) {
        return switch (rarity) {
            case COMMON -> 1;
            case UNCOMMON -> 2;
            case RARE -> 3;
            case EPIC -> 4;
            case LEGENDARY -> 5;
        };
    }

    // ==========================================
    // DTOs
    // ==========================================

    public static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;
        
        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }
        
        public static ValidationResult success() {
            return new ValidationResult(true, null);
        }
        
        public static ValidationResult failure(String errorMessage) {
            return new ValidationResult(false, errorMessage);
        }
        
        public boolean isValid() {
            return valid;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
    }

    public static class PurchaseValidationResult extends ValidationResult {
        private PurchaseValidationResult(boolean valid, String errorMessage) {
            super(valid, errorMessage);
        }
        
        public static PurchaseValidationResult success() {
            return new PurchaseValidationResult(true, null);
        }
        
        public static PurchaseValidationResult failure(String errorMessage) {
            return new PurchaseValidationResult(false, errorMessage);
        }
    }
}
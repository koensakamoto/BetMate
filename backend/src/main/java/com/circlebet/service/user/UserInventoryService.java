package com.circlebet.service.user;

import com.circlebet.dto.store.response.InventoryItemResponseDto;
import com.circlebet.dto.store.response.InventorySummaryResponseDto;
import com.circlebet.dto.store.response.PopularItemResponseDto;
import com.circlebet.dto.store.response.UserLoadoutResponseDto;
import com.circlebet.entity.store.StoreItem;
import com.circlebet.entity.user.User;
import com.circlebet.entity.user.UserInventory;
import com.circlebet.mapper.InventoryMapper;
import com.circlebet.repository.user.UserInventoryRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing user inventory and owned items.
 * Handles purchasing, equipping, and managing store items owned by users.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class UserInventoryService {

    private final UserInventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;
    // private final StoreService storeService; // TODO: Add when StoreService is created
    // private final UserService userService; // TODO: Add when needed

    @Autowired
    public UserInventoryService(UserInventoryRepository inventoryRepository, InventoryMapper inventoryMapper) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryMapper = inventoryMapper;
        // this.storeService = storeService; // TODO: Add when StoreService is created
        // this.userService = userService; // TODO: Add when needed
    }

    /**
     * Retrieves an inventory item by ID.
     */
    public UserInventory getInventoryItemById(@NotNull Long inventoryId) {
        return inventoryRepository.findById(inventoryId)
            .orElseThrow(() -> new InventoryItemNotFoundException("Inventory item not found: " + inventoryId));
    }

    /**
     * Retrieves all inventory items for a user.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public List<InventoryItemResponseDto> getUserInventory(@NotNull User user) {
        List<UserInventory> inventories = inventoryRepository.findByUserAndIsActiveTrue(user);
        return inventoryMapper.toInventoryItemResponseList(inventories);
    }

    /**
     * Retrieves user inventory by item type.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public List<InventoryItemResponseDto> getUserInventoryByType(@NotNull User user, @NotNull StoreItem.ItemType itemType) {
        List<UserInventory> inventories = inventoryRepository.findByUserAndStoreItem_ItemType(user, itemType);
        return inventoryMapper.toInventoryItemResponseList(inventories);
    }

    /**
     * Retrieves user's currently equipped items.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public List<InventoryItemResponseDto> getEquippedItems(@NotNull User user) {
        List<UserInventory> equippedItems = inventoryRepository.findByUserAndIsEquippedTrue(user);
        return inventoryMapper.toInventoryItemResponseList(equippedItems);
    }

    /**
     * Retrieves user's equipped item of a specific type.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public Optional<UserInventory> getEquippedItemByType(@NotNull User user, @NotNull StoreItem.ItemType itemType) {
        return inventoryRepository.findEquippedItemByType(user, itemType);
    }

    /**
     * Checks if user owns a specific store item.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public boolean ownsItem(@NotNull User user, @NotNull StoreItem storeItem) {
        return inventoryRepository.existsByUserAndStoreItemAndIsActiveTrue(user, storeItem);
    }

    /**
     * Adds an item to user's inventory (typically after purchase).
     */
    @Transactional
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public UserInventory addItemToInventory(@NotNull User user, @NotNull StoreItem storeItem, 
                                          @NotNull BigDecimal pricePaid) {
        // Check if user already owns this item
        if (ownsItem(user, storeItem)) {
            throw new IllegalStateException("User already owns this item");
        }

        UserInventory inventory = new UserInventory();
        inventory.setUser(user);
        inventory.setStoreItem(storeItem);
        inventory.setPurchasePrice(pricePaid);
        // purchasedAt is set automatically in @PrePersist
        inventory.setIsActive(true);
        inventory.setIsEquipped(false);

        return inventoryRepository.save(inventory);
    }

    /**
     * Equips an item for the user.
     */
    @Transactional
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public void equipItem(@NotNull User user, @NotNull Long inventoryId) {
        UserInventory inventoryItem = getInventoryItemById(inventoryId);
        
        // Verify ownership
        if (!inventoryItem.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("User does not own this item");
        }

        if (!inventoryItem.getIsActive()) {
            throw new IllegalStateException("Cannot equip inactive item");
        }

        StoreItem.ItemType itemType = inventoryItem.getStoreItem().getItemType();

        // Unequip currently equipped item of same type
        Optional<UserInventory> currentlyEquipped = getEquippedItemByType(user, itemType);
        if (currentlyEquipped.isPresent()) {
            currentlyEquipped.get().setIsEquipped(false);
            inventoryRepository.save(currentlyEquipped.get());
        }

        // Equip the new item
        inventoryItem.setIsEquipped(true);
        inventoryItem.setEquippedAt(LocalDateTime.now());
        inventoryRepository.save(inventoryItem);
    }

    /**
     * Unequips an item for the user.
     */
    @Transactional
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public void unequipItem(@NotNull User user, @NotNull Long inventoryId) {
        UserInventory inventoryItem = getInventoryItemById(inventoryId);
        
        // Verify ownership
        if (!inventoryItem.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("User does not own this item");
        }

        if (!inventoryItem.getIsEquipped()) {
            throw new IllegalStateException("Item is not currently equipped");
        }

        inventoryItem.setIsEquipped(false);
        inventoryItem.setEquippedAt(null);
        inventoryRepository.save(inventoryItem);
    }

    /**
     * Unequips all items of a specific type for the user.
     */
    @Transactional
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public void unequipItemsByType(@NotNull User user, @NotNull StoreItem.ItemType itemType) {
        List<UserInventory> equippedItems = inventoryRepository.findByUserAndStoreItem_ItemTypeAndIsEquippedTrueAndIsActiveTrue(user, itemType);
        
        for (UserInventory item : equippedItems) {
            item.setIsEquipped(false);
            item.setEquippedAt(null);
            inventoryRepository.save(item);
        }
    }

    /**
     * Gets user's inventory value (total spent on items).
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public BigDecimal getUserInventoryValue(@NotNull User user) {
        return inventoryRepository.getTotalInventoryValue(user);
    }

    /**
     * Gets user's inventory count.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public Long getUserInventoryCount(@NotNull User user) {
        return inventoryRepository.countByUserAndIsActiveTrue(user);
    }

    /**
     * Gets user's inventory count by type.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public Long getUserInventoryCountByType(@NotNull User user, @NotNull StoreItem.ItemType itemType) {
        return inventoryRepository.countByUserAndStoreItem_ItemTypeAndIsActiveTrue(user, itemType);
    }

    /**
     * Gets user's recent purchases.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public List<InventoryItemResponseDto> getRecentPurchases(@NotNull User user, int limit) {
        List<UserInventory> recentPurchases = inventoryRepository.findByUserAndIsActiveTrueOrderByPurchasedAtDesc(user)
            .stream()
            .limit(limit)
            .toList();
        return inventoryMapper.toInventoryItemResponseList(recentPurchases);
    }

    /**
     * Gets user's equipped loadout summary.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public UserLoadoutResponseDto getUserLoadout(@NotNull User user) {
        List<UserInventory> equippedItems = inventoryRepository.findByUserAndIsEquippedTrue(user);
        return inventoryMapper.toUserLoadoutResponse(equippedItems);
    }

    /**
     * Gets user's inventory summary with statistics.
     */
    @PreAuthorize("#user.username == authentication.name or hasRole('ADMIN')")
    public InventorySummaryResponseDto getInventorySummary(@NotNull User user) {
        Long totalItems = getUserInventoryCount(user);
        BigDecimal totalValue = getUserInventoryValue(user);
        
        // Get items by type
        Map<String, Long> itemsByType = new java.util.HashMap<>();
        for (StoreItem.ItemType itemType : StoreItem.ItemType.values()) {
            Long count = getUserInventoryCountByType(user, itemType);
            if (count > 0) {
                itemsByType.put(itemType.name(), count);
            }
        }
        
        // Get recent purchases (last 5)
        List<InventoryItemResponseDto> recentPurchases = getRecentPurchases(user, 5);
        
        return new InventorySummaryResponseDto(totalItems, totalValue, itemsByType, recentPurchases);
    }

    /**
     * Removes an item from user's inventory (soft delete).
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void removeItemFromInventory(@NotNull Long inventoryId, @NotNull String reason) {
        UserInventory inventoryItem = getInventoryItemById(inventoryId);
        
        // Unequip if currently equipped
        if (inventoryItem.getIsEquipped()) {
            inventoryItem.setIsEquipped(false);
            inventoryItem.setEquippedAt(null);
        }
        
        inventoryItem.setIsActive(false);
        inventoryItem.setRemovedAt(LocalDateTime.now());
        inventoryItem.setRemovalReason(reason);
        
        inventoryRepository.save(inventoryItem);
    }

    /**
     * Transfers an item from one user to another (admin only).
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserInventory transferItem(@NotNull Long inventoryId, @NotNull User newOwner) {
        UserInventory originalItem = getInventoryItemById(inventoryId);
        
        // Remove from original owner
        removeItemFromInventory(inventoryId, "Transferred to user: " + newOwner.getUsername());
        
        // Add to new owner
        return addItemToInventory(newOwner, originalItem.getStoreItem(), originalItem.getPricePaid());
    }


    // ==========================================
    // EXCEPTIONS
    // ==========================================

    public static class InventoryItemNotFoundException extends RuntimeException {
        public InventoryItemNotFoundException(String message) {
            super(message);
        }
    }
}
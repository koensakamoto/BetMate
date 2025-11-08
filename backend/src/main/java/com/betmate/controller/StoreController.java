package com.betmate.controller;

import com.betmate.dto.store.request.EquipItemRequestDto;
import com.betmate.dto.store.request.PurchaseItemRequestDto;
import com.betmate.dto.store.request.RemoveItemRequestDto;
import com.betmate.dto.store.response.*;
import com.betmate.entity.store.StoreItem;
import com.betmate.entity.user.User;
import com.betmate.entity.user.UserInventory;
import com.betmate.service.store.StoreService;
import com.betmate.service.user.UserInventoryService;
import com.betmate.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for store operations.
 * Handles store browsing, purchasing, and inventory management.
 */
@RestController
@RequestMapping("/api/store")
public class StoreController {

    private final StoreService storeService;
    private final UserInventoryService userInventoryService;
    private final UserService userService;

    @Autowired
    public StoreController(StoreService storeService,
                          UserInventoryService userInventoryService,
                          UserService userService) {
        this.storeService = storeService;
        this.userInventoryService = userInventoryService;
        this.userService = userService;
    }

    /**
     * Get all available store items.
     */
    @GetMapping("/items")
    public ResponseEntity<List<StoreItemResponseDto>> getStoreItems(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<StoreItem> items = storeService.getAvailableItems();
        List<StoreItemResponseDto> response = items.stream()
            .map(item -> convertToStoreItemResponse(item, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get store items by category.
     */
    @GetMapping("/items/category/{category}")
    public ResponseEntity<List<StoreItemResponseDto>> getItemsByCategory(
            @PathVariable StoreItem.ItemCategory category,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<StoreItem> items = storeService.getItemsByCategory(category);
        List<StoreItemResponseDto> response = items.stream()
            .map(item -> convertToStoreItemResponse(item, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get featured store items.
     */
    @GetMapping("/items/featured")
    public ResponseEntity<List<StoreItemResponseDto>> getFeaturedItems(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<StoreItem> items = storeService.getFeaturedItems();
        List<StoreItemResponseDto> response = items.stream()
            .map(item -> convertToStoreItemResponse(item, currentUser))
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get store item details by ID.
     */
    @GetMapping("/items/{itemId}")
    public ResponseEntity<StoreItemResponseDto> getStoreItem(
            @PathVariable Long itemId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        StoreItem item = storeService.getStoreItem(itemId);
        StoreItemResponseDto response = convertToStoreItemResponse(item, currentUser);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Purchase a store item.
     */
    @PostMapping("/purchase")
    public ResponseEntity<InventoryItemResponseDto> purchaseItem(
            @Valid @RequestBody PurchaseItemRequestDto request,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserInventory purchasedItem = storeService.purchaseItem(currentUser, request.getStoreItemId(), request.getPricePaid());
        InventoryItemResponseDto response = convertToInventoryItemResponse(purchasedItem);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get user's inventory.
     */
    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryItemResponseDto>> getInventory(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<InventoryItemResponseDto> inventory = userInventoryService.getUserInventory(currentUser);
        List<InventoryItemResponseDto> response = inventory;
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get user's inventory summary.
     */
    @GetMapping("/inventory/summary")
    public ResponseEntity<InventorySummaryResponseDto> getInventorySummary(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        InventorySummaryResponseDto summary = userInventoryService.getInventorySummary(currentUser);
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Equip an item from inventory.
     */
    @PostMapping("/inventory/equip")
    public ResponseEntity<EquippedItemResponseDto> equipItem(
            @Valid @RequestBody EquipItemRequestDto request,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        userInventoryService.equipItem(currentUser, request.getInventoryId());
        UserInventory equippedItem = userInventoryService.getInventoryItemById(request.getInventoryId());
        EquippedItemResponseDto response = convertToEquippedItemResponse(equippedItem);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Remove/unequip an item from active loadout.
     */
    @PostMapping("/inventory/remove")
    public ResponseEntity<Void> removeItem(
            @Valid @RequestBody RemoveItemRequestDto request,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        userInventoryService.unequipItem(currentUser, request.getInventoryId());
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get user's current loadout (equipped items).
     */
    @GetMapping("/inventory/loadout")
    public ResponseEntity<UserLoadoutResponseDto> getUserLoadout(
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserLoadoutResponseDto loadout = userInventoryService.getUserLoadout(currentUser);
        
        return ResponseEntity.ok(loadout);
    }

    // Helper methods for DTO conversion
    private StoreItemResponseDto convertToStoreItemResponse(StoreItem item, User currentUser) {
        StoreItemResponseDto response = StoreItemResponseDto.fromEntity(item);

        // Set user context
        response.setUserOwns(userInventoryService.ownsItem(currentUser, item));
        response.setUserCanAfford(currentUser.getCreditBalance().compareTo(item.getPrice()) >= 0);

        return response;
    }

    private InventoryItemResponseDto convertToInventoryItemResponse(UserInventory inventoryItem) {
        InventoryItemResponseDto response = new InventoryItemResponseDto();
        response.setId(inventoryItem.getId());
        response.setItemName(inventoryItem.getStoreItem().getName());
        response.setItemType(inventoryItem.getStoreItem().getItemType().name());
        response.setRarity(inventoryItem.getStoreItem().getRarity().name());
        response.setIconUrl(inventoryItem.getStoreItem().getIconUrl());

        // Debug logging
        System.out.println("=== INVENTORY ITEM DEBUG ===");
        System.out.println("Item ID: " + inventoryItem.getStoreItem().getId());
        System.out.println("Item Name: " + inventoryItem.getStoreItem().getName());
        System.out.println("Short Description: " + inventoryItem.getStoreItem().getShortDescription());
        System.out.println("Description: " + inventoryItem.getStoreItem().getDescription());
        System.out.println("===========================");

        response.setShortDescription(inventoryItem.getStoreItem().getShortDescription());
        response.setDescription(inventoryItem.getStoreItem().getDescription());
        response.setPurchasePrice(inventoryItem.getPurchasePrice());
        response.setPurchasedAt(inventoryItem.getPurchasedAt());
        response.setIsEquipped(inventoryItem.getIsEquipped());
        response.setEquippedAt(inventoryItem.getEquippedAt());
        response.setUsageCount(0L); // Usage count tracking not implemented in entity yet
        response.setLastUsedAt(inventoryItem.getLastUsedAt());
        response.setIsActive(inventoryItem.getIsActive());
        
        return response;
    }

    private EquippedItemResponseDto convertToEquippedItemResponse(UserInventory inventoryItem) {
        EquippedItemResponseDto response = new EquippedItemResponseDto();
        response.setInventoryId(inventoryItem.getId());
        response.setItemName(inventoryItem.getStoreItem().getName());
        response.setItemType(inventoryItem.getStoreItem().getItemType().name());
        response.setRarity(inventoryItem.getStoreItem().getRarity().name());
        response.setIconUrl(inventoryItem.getStoreItem().getIconUrl());
        response.setEquippedAt(inventoryItem.getEquippedAt());
        
        return response;
    }
}
package com.circlebet.repository.user;

import com.circlebet.entity.store.StoreItem;
import com.circlebet.entity.user.User;
import com.circlebet.entity.user.UserInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserInventoryRepository extends JpaRepository<UserInventory, Long> {
    
    // Basic inventory queries
    List<UserInventory> findByUser(User user);
    List<UserInventory> findByUserAndIsActiveTrue(User user);
    Optional<UserInventory> findByUserAndStoreItem(User user, StoreItem storeItem);
    
    // Ownership checks
    boolean existsByUserAndStoreItem(User user, StoreItem storeItem);
    boolean existsByUserAndStoreItemAndIsActiveTrue(User user, StoreItem storeItem);
    
    // Item type queries
    List<UserInventory> findByUserAndStoreItem_ItemType(User user, StoreItem.ItemType itemType);
    List<UserInventory> findByUserAndStoreItem_Category(User user, StoreItem.ItemCategory category);
    
    // Equipped items
    List<UserInventory> findByUserAndIsEquippedTrue(User user);
    List<UserInventory> findByUserAndIsEquippedTrueAndStoreItem_ItemType(User user, StoreItem.ItemType itemType);
    List<UserInventory> findByUserAndStoreItem_ItemTypeAndIsEquippedTrueAndIsActiveTrue(User user, StoreItem.ItemType itemType);
    
    @Query("SELECT ui FROM UserInventory ui WHERE ui.user = :user AND ui.isEquipped = true AND ui.storeItem.itemType = :itemType AND ui.isActive = true")
    Optional<UserInventory> findEquippedItemByType(@Param("user") User user, @Param("itemType") StoreItem.ItemType itemType);
    
    // Recent purchases
    List<UserInventory> findByUserAndPurchasedAtAfter(User user, LocalDateTime since);
    
    @Query("SELECT ui FROM UserInventory ui WHERE ui.user = :user AND ui.isActive = true ORDER BY ui.purchasedAt DESC")
    List<UserInventory> findUserInventoryOrderedByPurchaseDate(@Param("user") User user);
    
    List<UserInventory> findByUserAndIsActiveTrueOrderByPurchasedAtDesc(User user);
    
    // Usage tracking
    List<UserInventory> findByUserAndLastUsedAtAfter(User user, LocalDateTime since);
    List<UserInventory> findByUserAndUsageCountGreaterThan(User user, Long minUsage);
    
    // Item collections
    @Query("SELECT ui FROM UserInventory ui WHERE ui.user = :user AND ui.storeItem.itemType IN :itemTypes AND ui.isActive = true")
    List<UserInventory> findUserItemsByTypes(@Param("user") User user, @Param("itemTypes") List<StoreItem.ItemType> itemTypes);
    
    @Query("SELECT ui FROM UserInventory ui WHERE ui.user = :user AND ui.storeItem.rarity = :rarity AND ui.isActive = true")
    List<UserInventory> findUserItemsByRarity(@Param("user") User user, @Param("rarity") StoreItem.Rarity rarity);
    
    // Analytics

    Long countByUserAndIsActiveTrue(User user);
    
    Long countByUserAndStoreItem_ItemTypeAndIsActiveTrue(User user, StoreItem.ItemType itemType);
    
    @Query("SELECT ui.storeItem.itemType, COUNT(ui) FROM UserInventory ui WHERE ui.user = :user AND ui.isActive = true GROUP BY ui.storeItem.itemType")
    List<Object[]> getUserItemCountByType(@Param("user") User user);
    
    @Query("SELECT SUM(ui.purchasePrice) FROM UserInventory ui WHERE ui.user = :user")
    java.math.BigDecimal getTotalSpentByUser(@Param("user") User user);
    
    @Query("SELECT SUM(ui.purchasePrice) FROM UserInventory ui WHERE ui.user = :user AND ui.isActive = true")
    java.math.BigDecimal getTotalInventoryValue(@Param("user") User user);
    
    // Popular items and analytics
    @Query("SELECT ui.storeItem, COUNT(ui) FROM UserInventory ui WHERE ui.isActive = true GROUP BY ui.storeItem ORDER BY COUNT(ui) DESC")
    List<Object[]> getMostPopularItems();
    
    @Query("SELECT COUNT(ui) FROM UserInventory ui WHERE ui.storeItem = :storeItem AND ui.isActive = true")
    Long countOwnersByItem(@Param("storeItem") StoreItem storeItem);
    
    @Query("SELECT SUM(ui.purchasePrice) FROM UserInventory ui WHERE ui.isActive = true")
    java.math.BigDecimal getTotalRevenue();
    
    // Additional methods for StoreManagementService
    List<UserInventory> findByStoreItemAndIsActiveTrue(StoreItem storeItem);
    
    @Query("SELECT SUM(ui.purchasePrice) FROM UserInventory ui WHERE ui.storeItem = :storeItem AND ui.isActive = true")
    java.math.BigDecimal getTotalRevenueByItem(@Param("storeItem") StoreItem storeItem);
    
    @Query("SELECT ui FROM UserInventory ui WHERE ui.purchasedAt >= :start AND ui.purchasedAt < :end AND ui.isActive = true")
    List<UserInventory> findPurchasesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Category-based counting for validation
    Long countByUserAndStoreItem_CategoryAndIsActiveTrue(User user, StoreItem.ItemCategory category);
}
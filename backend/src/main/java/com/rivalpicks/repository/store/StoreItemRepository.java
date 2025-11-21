package com.rivalpicks.repository.store;

import com.rivalpicks.entity.store.StoreItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoreItemRepository extends JpaRepository<StoreItem, Long> {
    
    // Basic item queries
    List<StoreItem> findByIsActiveTrue();
    List<StoreItem> findByItemType(StoreItem.ItemType itemType);
    List<StoreItem> findByCategory(StoreItem.ItemCategory category);
    List<StoreItem> findByRarity(StoreItem.Rarity rarity);
    
    // Store display queries
    List<StoreItem> findByIsActiveTrueOrderBySortOrder();
    List<StoreItem> findByCategoryAndIsActiveTrueOrderBySortOrder(StoreItem.ItemCategory category);
    List<StoreItem> findByIsActiveTrueAndIsFeaturedTrue();
    
    // Price-based queries
    List<StoreItem> findByPriceLessThanEqual(BigDecimal maxPrice);
    List<StoreItem> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
    List<StoreItem> findByIsActiveTrueOrderByPriceAsc();
    
    // Limited time items
    List<StoreItem> findByIsLimitedTimeTrue();
    List<StoreItem> findByIsLimitedTimeTrueAndAvailableUntilAfter(LocalDateTime currentTime);
    
    @Query("SELECT s FROM StoreItem s WHERE s.isLimitedTime = true AND s.availableUntil IS NOT NULL AND s.availableUntil <= :currentTime AND s.isActive = true")
    List<StoreItem> findExpiredLimitedTimeItems(@Param("currentTime") LocalDateTime currentTime);
    
    // Available items for purchase
    @Query("SELECT s FROM StoreItem s WHERE s.isActive = true AND " +
           "(s.isLimitedTime = false OR (s.isLimitedTime = true AND s.availableUntil > :currentTime))")
    List<StoreItem> findAvailableItems(@Param("currentTime") LocalDateTime currentTime);
    
    // Search functionality
    @Query("SELECT s FROM StoreItem s WHERE s.isActive = true AND " +
           "(LOWER(s.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<StoreItem> searchItems(@Param("searchTerm") String searchTerm);
    
    // Analytics
    @Query("SELECT COUNT(s) FROM StoreItem s WHERE s.isActive = true")
    Long countActiveItems();
    
    @Query("SELECT s.category, COUNT(s) FROM StoreItem s WHERE s.isActive = true GROUP BY s.category")
    List<Object[]> getItemCountByCategory();
    
    @Query("SELECT s.rarity, COUNT(s) FROM StoreItem s WHERE s.isActive = true GROUP BY s.rarity")
    List<Object[]> getItemCountByRarity();
}
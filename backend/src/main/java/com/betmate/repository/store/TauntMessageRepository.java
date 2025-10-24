package com.betmate.repository.store;

import com.betmate.entity.store.StoreItem;
import com.betmate.entity.store.TauntMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TauntMessageRepository extends JpaRepository<TauntMessage, Long> {
    
    // Basic queries
    List<TauntMessage> findByIsActiveTrueAndIsApprovedTrue();
    List<TauntMessage> findByCategory(TauntMessage.TauntCategory category);
    List<TauntMessage> findByRarity(StoreItem.Rarity rarity);
    List<TauntMessage> findByPackName(String packName);
    
    // Available taunts for use
    @Query("SELECT t FROM TauntMessage t WHERE t.isActive = true AND t.isApproved = true AND t.isReported = false ORDER BY t.sortOrder")
    List<TauntMessage> findAvailableTaunts();
    
    @Query("SELECT t FROM TauntMessage t WHERE t.category = :category AND t.isActive = true AND t.isApproved = true AND t.isReported = false ORDER BY t.sortOrder")
    List<TauntMessage> findAvailableTauntsByCategory(@Param("category") TauntMessage.TauntCategory category);
    
    // Popular taunts
    List<TauntMessage> findByTotalUsageGreaterThanOrderByTotalUsageDesc(Long minUsage);
    
    @Query("SELECT t FROM TauntMessage t WHERE t.isActive = true ORDER BY t.totalUsage DESC")
    List<TauntMessage> findMostPopularTaunts();
    
    // Moderation queries
    List<TauntMessage> findByIsReportedTrue();
    List<TauntMessage> findByIsApprovedFalse();
    List<TauntMessage> findByIsReportedTrueOrIsApprovedFalse();
    
    // Search functionality
    @Query("SELECT t FROM TauntMessage t WHERE t.isActive = true AND t.isApproved = true AND " +
           "LOWER(t.messageText) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<TauntMessage> searchTaunts(@Param("searchTerm") String searchTerm);
    
    // Pack-based queries
    @Query("SELECT DISTINCT t.packName FROM TauntMessage t WHERE t.packName IS NOT NULL AND t.isActive = true")
    List<String> findAllPackNames();
    
    @Query("SELECT t FROM TauntMessage t WHERE t.packName = :packName AND t.isActive = true ORDER BY t.sortOrder")
    List<TauntMessage> findTauntsByPack(@Param("packName") String packName);
    
    // Analytics
    @Query("SELECT COUNT(t) FROM TauntMessage t WHERE t.isActive = true AND t.isApproved = true")
    Long countAvailableTaunts();
    
    @Query("SELECT t.category, COUNT(t) FROM TauntMessage t WHERE t.isActive = true GROUP BY t.category")
    List<Object[]> getTauntCountByCategory();
}
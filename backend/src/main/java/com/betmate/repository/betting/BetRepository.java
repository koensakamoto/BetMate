package com.betmate.repository.betting;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.group.Group;
import com.betmate.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BetRepository extends JpaRepository<Bet, Long> {
    
    // Status queries
    List<Bet> findByStatus(Bet.BetStatus status);
    List<Bet> findByStatusAndDeletedAtIsNull(Bet.BetStatus status);
    List<Bet> findByOutcome(Bet.BetOutcome outcome);
    
    // Group-related queries
    List<Bet> findByGroup(Group group);
    List<Bet> findByGroupAndStatus(Group group, Bet.BetStatus status);
    List<Bet> findByGroupOrderByCreatedAtDesc(Group group);
    
    // Creator queries
    List<Bet> findByCreator(User creator);
    List<Bet> findByCreatorAndStatus(User creator, Bet.BetStatus status);
    
    // Time-based queries
    List<Bet> findByBettingDeadlineBefore(LocalDateTime deadline);
    List<Bet> findByBettingDeadlineAfter(LocalDateTime deadline);
    List<Bet> findByResolveDateBefore(LocalDateTime resolveDate);
    
    @Query("SELECT b FROM Bet b WHERE b.bettingDeadline BETWEEN :start AND :end AND b.status = 'OPEN'")
    List<Bet> findBetsExpiringBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // Pool and participation queries
    List<Bet> findByTotalPoolGreaterThan(BigDecimal minPool);
    List<Bet> findByTotalParticipantsGreaterThan(Integer minParticipants);
    List<Bet> findByMinimumBetLessThanEqual(BigDecimal maxMinimum);
    
    // Active betting queries
    @Query("SELECT b FROM Bet b WHERE b.status = 'OPEN' AND b.bettingDeadline > :currentTime AND b.isActive = true AND b.deletedAt IS NULL")
    List<Bet> findActiveBets(@Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT b FROM Bet b WHERE b.status = 'OPEN' AND b.bettingDeadline <= :currentTime AND b.deletedAt IS NULL")
    List<Bet> findExpiredOpenBets(@Param("currentTime") LocalDateTime currentTime);
    
    // Popular bets
    @Query("SELECT b FROM Bet b WHERE b.deletedAt IS NULL ORDER BY b.totalParticipants DESC")
    List<Bet> findMostPopularBets();
    
    @Query("SELECT b FROM Bet b WHERE b.deletedAt IS NULL ORDER BY b.totalPool DESC")
    List<Bet> findHighestValueBets();
    
    // User participation queries
    @Query("SELECT DISTINCT b FROM Bet b JOIN b.participations p WHERE p.user = :user")
    List<Bet> findBetsByParticipant(@Param("user") User user);
    
    @Query("SELECT b FROM Bet b WHERE b.group IN " +
           "(SELECT gm.group FROM GroupMembership gm WHERE gm.user = :user AND gm.isActive = true) " +
           "AND b.status = 'OPEN' AND b.bettingDeadline > :currentTime AND b.deletedAt IS NULL")
    List<Bet> findAvailableBetsForUser(@Param("user") User user, @Param("currentTime") LocalDateTime currentTime);
    
    // Resolution queries
    List<Bet> findByStatusAndResolvedAtIsNull(Bet.BetStatus status);
    
    @Query("SELECT b FROM Bet b WHERE b.status = 'CLOSED' AND b.resolveDate IS NOT NULL AND b.resolveDate <= :currentTime")
    List<Bet> findBetsReadyForResolution(@Param("currentTime") LocalDateTime currentTime);
    
    // Analytics queries
    @Query("SELECT COUNT(b) FROM Bet b WHERE b.createdAt >= :start AND b.createdAt < :end")
    Long countBetsCreatedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(b) FROM Bet b WHERE b.status = 'RESOLVED' AND b.resolvedAt >= :start AND b.resolvedAt < :end")
    Long countBetsResolvedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT AVG(b.totalPool) FROM Bet b WHERE b.status = 'RESOLVED'")
    BigDecimal getAverageBetPool();
    
    @Query("SELECT AVG(b.totalParticipants) FROM Bet b WHERE b.status = 'RESOLVED'")
    Double getAverageParticipants();
    
    // Search functionality
    @Query("SELECT b FROM Bet b WHERE b.deletedAt IS NULL AND " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(b.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Bet> searchBets(@Param("searchTerm") String searchTerm);
    
    // Atomic status transition methods
    @Modifying
    @Query("UPDATE Bet b SET b.status = 'CLOSED' WHERE b.id = :betId AND b.status = 'OPEN'")
    int closeBetAtomically(@Param("betId") Long betId);
    
    @Modifying
    @Query("UPDATE Bet b SET b.status = 'CANCELLED' WHERE b.id = :betId AND b.status != 'RESOLVED'")
    int cancelBetAtomically(@Param("betId") Long betId);
}
package com.rivalpicks.repository.betting;

import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.user.User;
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

    // Get visible bets for a profile viewer based on privacy rules
    @Query("SELECT DISTINCT b FROM Bet b " +
           "JOIN b.participations p " +
           "WHERE p.user = :profileUser " +
           "AND b.deletedAt IS NULL " +
           "AND (" +
           "  b.group.privacy = 'PUBLIC' " +
           "  OR EXISTS (" +
           "    SELECT gm FROM GroupMembership gm " +
           "    WHERE gm.group = b.group " +
           "    AND gm.user = :viewerUser " +
           "    AND gm.isActive = true" +
           "  )" +
           ") " +
           "ORDER BY b.createdAt DESC")
    List<Bet> findVisibleBetsForProfile(@Param("profileUser") User profileUser, @Param("viewerUser") User viewerUser);
    
    // Resolution queries
    List<Bet> findByStatusAndResolvedAtIsNull(Bet.BetStatus status);
    
    @Query("SELECT b FROM Bet b WHERE b.status = 'CLOSED' AND b.resolveDate IS NOT NULL AND b.resolveDate <= :currentTime")
    List<Bet> findBetsReadyForResolution(@Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT b FROM Bet b WHERE b.status IN ('OPEN', 'CLOSED') AND b.status != 'CANCELLED' AND b.resolveDate IS NOT NULL " +
           "AND b.resolveDate > :twentyThreeHours45Minutes AND b.resolveDate <= :twentyFourHours15Minutes " +
           "AND b.resolution24HourReminderSentAt IS NULL AND b.deletedAt IS NULL")
    List<Bet> findBetsNeedingTwentyFourHourResolutionReminder(
        @Param("twentyThreeHours45Minutes") LocalDateTime twentyThreeHours45Minutes,
        @Param("twentyFourHours15Minutes") LocalDateTime twentyFourHours15Minutes
    );

    @Query("SELECT b FROM Bet b WHERE b.status IN ('OPEN', 'CLOSED') AND b.status != 'CANCELLED' AND b.resolveDate IS NOT NULL " +
           "AND b.resolveDate > :fortyFiveMinutes AND b.resolveDate <= :oneHour15Minutes " +
           "AND b.resolution1HourReminderSentAt IS NULL AND b.deletedAt IS NULL")
    List<Bet> findBetsNeedingOneHourResolutionReminder(
        @Param("fortyFiveMinutes") LocalDateTime fortyFiveMinutes,
        @Param("oneHour15Minutes") LocalDateTime oneHour15Minutes
    );

    // Betting deadline reminder queries
    @Query("SELECT b FROM Bet b WHERE b.status = 'OPEN' AND b.deletedAt IS NULL " +
           "AND b.bettingDeadline > :twentyThreeHours45Minutes AND b.bettingDeadline <= :twentyFourHours15Minutes " +
           "AND b.betting24HourReminderSentAt IS NULL")
    List<Bet> findBetsNeedingTwentyFourHourBettingReminder(
        @Param("twentyThreeHours45Minutes") LocalDateTime twentyThreeHours45Minutes,
        @Param("twentyFourHours15Minutes") LocalDateTime twentyFourHours15Minutes
    );

    @Query("SELECT b FROM Bet b WHERE b.status = 'OPEN' AND b.deletedAt IS NULL " +
           "AND b.bettingDeadline > :fortyFiveMinutes AND b.bettingDeadline <= :oneHour15Minutes " +
           "AND b.betting1HourReminderSentAt IS NULL")
    List<Bet> findBetsNeedingOneHourBettingReminder(
        @Param("fortyFiveMinutes") LocalDateTime fortyFiveMinutes,
        @Param("oneHour15Minutes") LocalDateTime oneHour15Minutes
    );

    // Urgent fallback queries - for bets that missed the regular reminder windows
    @Query("SELECT b FROM Bet b WHERE b.resolveDate IS NOT NULL " +
           "AND b.resolveDate > :now AND b.resolveDate < :oneHourFromNow " +
           "AND b.resolution24HourReminderSentAt IS NULL " +
           "AND b.resolution1HourReminderSentAt IS NULL " +
           "AND b.status NOT IN ('CANCELLED', 'RESOLVED') " +
           "AND b.deletedAt IS NULL")
    List<Bet> findUrgentBetsNeedingResolutionReminder(
        @Param("now") LocalDateTime now,
        @Param("oneHourFromNow") LocalDateTime oneHourFromNow
    );

    @Query("SELECT b FROM Bet b WHERE b.bettingDeadline IS NOT NULL " +
           "AND b.bettingDeadline > :now AND b.bettingDeadline < :oneHourFromNow " +
           "AND b.betting24HourReminderSentAt IS NULL " +
           "AND b.betting1HourReminderSentAt IS NULL " +
           "AND b.status = 'OPEN' " +
           "AND b.deletedAt IS NULL")
    List<Bet> findUrgentBetsNeedingBettingReminder(
        @Param("now") LocalDateTime now,
        @Param("oneHourFromNow") LocalDateTime oneHourFromNow
    );

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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Bet b SET b.status = 'CANCELLED' WHERE b.id = :betId AND b.status != 'RESOLVED'")
    int cancelBetAtomically(@Param("betId") Long betId);

    // Fulfillment update methods
    @Modifying
    @Query("UPDATE Bet b SET b.loserClaimedFulfilledAt = :claimedAt, b.loserFulfillmentProofUrl = :proofUrl, b.loserFulfillmentProofDescription = :proofDescription WHERE b.id = :betId")
    int updateLoserClaimAtomically(@Param("betId") Long betId, @Param("claimedAt") LocalDateTime claimedAt, @Param("proofUrl") String proofUrl, @Param("proofDescription") String proofDescription);
}
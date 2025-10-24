package com.betmate.repository.betting;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BetParticipationRepository extends JpaRepository<BetParticipation, Long> {
    
    // Basic participation queries
    Optional<BetParticipation> findByUserAndBet(User user, Bet bet);
    List<BetParticipation> findByUser(User user);
    List<BetParticipation> findByBet(Bet bet);

    // ID-based queries
    @Query("SELECT bp FROM BetParticipation bp WHERE bp.bet.id = :betId")
    List<BetParticipation> findByBetId(@Param("betId") Long betId);
    
    // Bet option queries
    List<BetParticipation> findByBetAndChosenOption(Bet bet, Integer chosenOption);
    List<BetParticipation> findByUserAndChosenOption(User user, Integer chosenOption);
    
    // Amount-based queries
    List<BetParticipation> findByBetAmountGreaterThan(BigDecimal minAmount);
    List<BetParticipation> findByBetAndBetAmountGreaterThan(Bet bet, BigDecimal minAmount);
    
    // Outcome queries using status
    List<BetParticipation> findByStatus(BetParticipation.ParticipationStatus status);
    List<BetParticipation> findByUserAndStatus(User user, BetParticipation.ParticipationStatus status);
    List<BetParticipation> findByBetAndStatus(Bet bet, BetParticipation.ParticipationStatus status);
    
    // Payout queries using actualWinnings
    List<BetParticipation> findByActualWinningsGreaterThan(BigDecimal minPayout);
    List<BetParticipation> findByUserAndActualWinningsGreaterThan(User user, BigDecimal minPayout);
    
    // Time-based queries
    List<BetParticipation> findByCreatedAtAfter(LocalDateTime since);
    List<BetParticipation> findByUserAndCreatedAtAfter(User user, LocalDateTime since);
    
    // Active participation checks
    boolean existsByUserAndBet(User user, Bet bet);
    
    @Query("SELECT COUNT(bp) FROM BetParticipation bp WHERE bp.bet = :bet")
    Long countParticipantsByBet(@Param("bet") Bet bet);
    
    @Query("SELECT COUNT(bp) FROM BetParticipation bp WHERE bp.user = :user")
    Long countParticipationsByUser(@Param("user") User user);
    
    // Option distribution for a bet
    @Query("SELECT bp.chosenOption, COUNT(bp) FROM BetParticipation bp WHERE bp.bet = :bet GROUP BY bp.chosenOption")
    List<Object[]> getOptionDistribution(@Param("bet") Bet bet);
    
    @Query("SELECT bp.chosenOption, SUM(bp.betAmount) FROM BetParticipation bp WHERE bp.bet = :bet GROUP BY bp.chosenOption")
    List<Object[]> getOptionAmountDistribution(@Param("bet") Bet bet);
    
    // User statistics
    @Query("SELECT COUNT(bp) FROM BetParticipation bp WHERE bp.user = :user AND bp.status = 'WON'")
    Long countUserWins(@Param("user") User user);
    
    @Query("SELECT COUNT(bp) FROM BetParticipation bp WHERE bp.user = :user AND bp.status = 'LOST'")
    Long countUserLosses(@Param("user") User user);
    
    @Query("SELECT SUM(bp.betAmount) FROM BetParticipation bp WHERE bp.user = :user")
    BigDecimal getTotalBetAmountByUser(@Param("user") User user);
    
    @Query("SELECT SUM(bp.actualWinnings) FROM BetParticipation bp WHERE bp.user = :user AND bp.status = 'WON'")
    BigDecimal getTotalWinningsByUser(@Param("user") User user);
    
    // Recent activity
    @Query("SELECT bp FROM BetParticipation bp WHERE bp.user = :user ORDER BY bp.createdAt DESC")
    List<BetParticipation> findUserRecentParticipations(@Param("user") User user);
    
    @Query("SELECT bp FROM BetParticipation bp WHERE bp.bet = :bet ORDER BY bp.createdAt DESC")
    List<BetParticipation> findBetRecentParticipations(@Param("bet") Bet bet);
    
    // Biggest bets/wins
    @Query("SELECT bp FROM BetParticipation bp ORDER BY bp.betAmount DESC")
    List<BetParticipation> findBiggestBets();
    
    @Query("SELECT bp FROM BetParticipation bp WHERE bp.status = 'WON' ORDER BY bp.actualWinnings DESC")
    List<BetParticipation> findBiggestWins();
    
    // Analytics queries
    @Query("SELECT bp FROM BetParticipation bp WHERE bp.createdAt >= :start AND bp.createdAt < :end")
    List<BetParticipation> findParticipationsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT AVG(bp.betAmount) FROM BetParticipation bp")
    BigDecimal getAverageBetAmount();
    
    @Query("SELECT COUNT(bp) FROM BetParticipation bp WHERE bp.createdAt >= :todayStart")
    Long countParticipationsToday(@Param("todayStart") LocalDateTime todayStart);
    
    // User betting patterns
    @Query("SELECT bp.chosenOption, COUNT(bp) FROM BetParticipation bp WHERE bp.user = :user GROUP BY bp.chosenOption")
    List<Object[]> getUserOptionPreferences(@Param("user") User user);
    
    @Query("SELECT HOUR(bp.createdAt), COUNT(bp) FROM BetParticipation bp WHERE bp.user = :user GROUP BY HOUR(bp.createdAt)")
    List<Object[]> getUserBettingTimePattern(@Param("user") User user);
}
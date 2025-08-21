package com.circlebet.repository.betting;

import com.circlebet.entity.betting.Bet;
import com.circlebet.entity.betting.BetResolver;
import com.circlebet.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BetResolverRepository extends JpaRepository<BetResolver, Long> {
    
    // Basic resolver queries
    Optional<BetResolver> findByBetAndResolverAndIsActiveTrue(Bet bet, User resolver);
    List<BetResolver> findByBetAndIsActiveTrue(Bet bet);
    List<BetResolver> findByResolverAndIsActiveTrue(User resolver);
    
    // Assignment queries
    List<BetResolver> findByAssignedByAndIsActiveTrue(User assignedBy);
    List<BetResolver> findByBetAndAssignedBy(Bet bet, User assignedBy);
    
    // Permission queries
    List<BetResolver> findByBetAndCanVoteOnlyFalseAndIsActiveTrue(Bet bet);
    List<BetResolver> findByBetAndCanVoteOnlyTrueAndIsActiveTrue(Bet bet);
    
    // Status queries
    List<BetResolver> findByIsActiveTrue();
    List<BetResolver> findByIsActiveFalse();
    List<BetResolver> findByRevokedAtIsNotNull();
    
    // Existence checks
    boolean existsByBetAndResolverAndIsActiveTrue(Bet bet, User resolver);
    boolean existsByBetAndAssignedByAndIsActiveTrue(Bet bet, User assignedBy);
    
    // Count queries
    @Query("SELECT COUNT(br) FROM BetResolver br WHERE br.bet = :bet AND br.isActive = true")
    Long countActiveResolversByBet(@Param("bet") Bet bet);
    
    @Query("SELECT COUNT(br) FROM BetResolver br WHERE br.resolver = :resolver AND br.isActive = true")
    Long countActiveAssignmentsByResolver(@Param("resolver") User resolver);
    
    @Query("SELECT COUNT(br) FROM BetResolver br WHERE br.assignedBy = :assignedBy AND br.isActive = true")
    Long countActiveAssignmentsByAssigner(@Param("assignedBy") User assignedBy);
    
    // Independent resolution capability
    @Query("SELECT br FROM BetResolver br WHERE br.resolver = :resolver AND br.isActive = true AND br.canVoteOnly = false")
    List<BetResolver> findIndependentAssignmentsByResolver(@Param("resolver") User resolver);
    
    // Vote-only resolvers
    @Query("SELECT br FROM BetResolver br WHERE br.bet = :bet AND br.isActive = true AND br.canVoteOnly = true")
    List<BetResolver> findVoteOnlyResolversByBet(@Param("bet") Bet bet);
    
    // Time-based queries
    List<BetResolver> findByCreatedAtAfter(LocalDateTime since);
    List<BetResolver> findByRevokedAtAfter(LocalDateTime since);
    
    @Query("SELECT br FROM BetResolver br WHERE br.bet = :bet ORDER BY br.createdAt DESC")
    List<BetResolver> findByBetOrderByCreatedAtDesc(@Param("bet") Bet bet);
    
    @Query("SELECT br FROM BetResolver br WHERE br.resolver = :resolver ORDER BY br.createdAt DESC")
    List<BetResolver> findByResolverOrderByCreatedAtDesc(@Param("resolver") User resolver);
    
    // Recently assigned resolvers
    @Query("SELECT br FROM BetResolver br WHERE br.isActive = true ORDER BY br.createdAt DESC")
    List<BetResolver> findRecentActiveAssignments();
    
    // Analytics queries
    @Query("SELECT COUNT(br) FROM BetResolver br WHERE br.createdAt >= :start AND br.createdAt < :end")
    Long countAssignmentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(br) FROM BetResolver br WHERE br.revokedAt >= :start AND br.revokedAt < :end")
    Long countRevocationsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // User assignment patterns
    @Query("SELECT br.assignedBy, COUNT(br) FROM BetResolver br WHERE br.isActive = true GROUP BY br.assignedBy")
    List<Object[]> getAssignmentCountsByAssigner();
    
    @Query("SELECT br.resolver, COUNT(br) FROM BetResolver br WHERE br.isActive = true GROUP BY br.resolver")
    List<Object[]> getAssignmentCountsByResolver();
    
    // Permission distribution
    @Query("SELECT br.canVoteOnly, COUNT(br) FROM BetResolver br WHERE br.isActive = true GROUP BY br.canVoteOnly")
    List<Object[]> getPermissionDistribution();
}
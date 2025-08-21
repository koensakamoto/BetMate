package com.circlebet.repository.betting;

import com.circlebet.entity.betting.Bet;
import com.circlebet.entity.betting.BetResolutionVote;
import com.circlebet.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BetResolutionVoteRepository extends JpaRepository<BetResolutionVote, Long> {
    
    // Basic vote queries
    Optional<BetResolutionVote> findByBetAndVoterAndIsActiveTrue(Bet bet, User voter);
    List<BetResolutionVote> findByBetAndIsActiveTrue(Bet bet);
    List<BetResolutionVote> findByVoterAndIsActiveTrue(User voter);
    
    // Outcome-based queries
    List<BetResolutionVote> findByBetAndVotedOutcomeAndIsActiveTrue(Bet bet, Bet.BetOutcome outcome);
    List<BetResolutionVote> findByVoterAndVotedOutcome(User voter, Bet.BetOutcome outcome);
    
    // Status queries
    List<BetResolutionVote> findByIsActiveTrue();
    List<BetResolutionVote> findByIsActiveFalse();
    List<BetResolutionVote> findByRevokedAtIsNotNull();
    
    // Existence checks
    boolean existsByBetAndVoterAndIsActiveTrue(Bet bet, User voter);
    boolean existsByBetAndVotedOutcomeAndIsActiveTrue(Bet bet, Bet.BetOutcome outcome);
    
    // Count queries
    @Query("SELECT COUNT(brv) FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true")
    Long countActiveVotesByBet(@Param("bet") Bet bet);
    
    @Query("SELECT COUNT(brv) FROM BetResolutionVote brv WHERE brv.voter = :voter AND brv.isActive = true")
    Long countActiveVotesByVoter(@Param("voter") User voter);
    
    @Query("SELECT COUNT(brv) FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.votedOutcome = :outcome AND brv.isActive = true")
    Long countVotesByBetAndOutcome(@Param("bet") Bet bet, @Param("outcome") Bet.BetOutcome outcome);
    
    // Vote distribution for consensus calculation
    @Query("SELECT brv.votedOutcome, COUNT(brv) FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.votedOutcome IS NOT NULL GROUP BY brv.votedOutcome")
    List<Object[]> getVoteDistributionByBet(@Param("bet") Bet bet);
    
    @Query("SELECT brv.votedOutcome, COUNT(brv) FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.revokedAt IS NULL AND brv.votedOutcome IS NOT NULL GROUP BY brv.votedOutcome")
    List<Object[]> getValidVoteDistributionByBet(@Param("bet") Bet bet);
    
    // Valid votes (active, not revoked, has outcome)
    @Query("SELECT brv FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.revokedAt IS NULL AND brv.votedOutcome IS NOT NULL")
    List<BetResolutionVote> findValidVotesByBet(@Param("bet") Bet bet);
    
    @Query("SELECT COUNT(brv) FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.revokedAt IS NULL AND brv.votedOutcome IS NOT NULL")
    Long countValidVotesByBet(@Param("bet") Bet bet);
    
    // Majority calculation helpers
    @Query("SELECT brv.votedOutcome FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.revokedAt IS NULL AND brv.votedOutcome IS NOT NULL GROUP BY brv.votedOutcome ORDER BY COUNT(brv) DESC")
    List<Bet.BetOutcome> findOutcomesByVoteCountDesc(@Param("bet") Bet bet);
    
    @Query("SELECT brv.votedOutcome, COUNT(brv) as voteCount FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.revokedAt IS NULL AND brv.votedOutcome IS NOT NULL GROUP BY brv.votedOutcome HAVING COUNT(brv) = (SELECT MAX(subCount) FROM (SELECT COUNT(brv2) as subCount FROM BetResolutionVote brv2 WHERE brv2.bet = :bet AND brv2.isActive = true AND brv2.revokedAt IS NULL AND brv2.votedOutcome IS NOT NULL GROUP BY brv2.votedOutcome) as maxCounts)")
    List<Object[]> findTopVotedOutcomes(@Param("bet") Bet bet);
    
    // Time-based queries
    List<BetResolutionVote> findByCreatedAtAfter(LocalDateTime since);
    List<BetResolutionVote> findByRevokedAtAfter(LocalDateTime since);
    
    @Query("SELECT brv FROM BetResolutionVote brv WHERE brv.bet = :bet ORDER BY brv.createdAt DESC")
    List<BetResolutionVote> findByBetOrderByCreatedAtDesc(@Param("bet") Bet bet);
    
    @Query("SELECT brv FROM BetResolutionVote brv WHERE brv.voter = :voter ORDER BY brv.createdAt DESC")
    List<BetResolutionVote> findByVoterOrderByCreatedAtDesc(@Param("voter") User voter);
    
    // Recent voting activity
    @Query("SELECT brv FROM BetResolutionVote brv WHERE brv.isActive = true ORDER BY brv.createdAt DESC")
    List<BetResolutionVote> findRecentActiveVotes();
    
    @Query("SELECT brv FROM BetResolutionVote brv WHERE brv.isActive = true AND brv.updatedAt > brv.createdAt ORDER BY brv.updatedAt DESC")
    List<BetResolutionVote> findRecentlyUpdatedVotes();
    
    // Votes with reasoning
    @Query("SELECT brv FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.reasoning IS NOT NULL AND brv.reasoning != ''")
    List<BetResolutionVote> findVotesWithReasoningByBet(@Param("bet") Bet bet);
    
    @Query("SELECT COUNT(brv) FROM BetResolutionVote brv WHERE brv.bet = :bet AND brv.isActive = true AND brv.reasoning IS NOT NULL AND brv.reasoning != ''")
    Long countVotesWithReasoningByBet(@Param("bet") Bet bet);
    
    // Analytics queries
    @Query("SELECT COUNT(brv) FROM BetResolutionVote brv WHERE brv.createdAt >= :start AND brv.createdAt < :end")
    Long countVotesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(brv) FROM BetResolutionVote brv WHERE brv.revokedAt >= :start AND brv.revokedAt < :end")
    Long countRevocationsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // User voting patterns
    @Query("SELECT brv.voter, COUNT(brv) FROM BetResolutionVote brv WHERE brv.isActive = true GROUP BY brv.voter")
    List<Object[]> getVoteCountsByVoter();
    
    @Query("SELECT brv.votedOutcome, COUNT(brv) FROM BetResolutionVote brv WHERE brv.voter = :voter AND brv.isActive = true GROUP BY brv.votedOutcome")
    List<Object[]> getOutcomePreferencesByVoter(@Param("voter") User voter);
    
    // Outcome popularity across all bets
    @Query("SELECT brv.votedOutcome, COUNT(brv) FROM BetResolutionVote brv WHERE brv.isActive = true GROUP BY brv.votedOutcome")
    List<Object[]> getGlobalOutcomeDistribution();
}
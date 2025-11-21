package com.betmate.repository.betting;

import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.entity.betting.PredictionResolutionVote;
import com.betmate.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionResolutionVoteRepository extends JpaRepository<PredictionResolutionVote, Long> {

    // ==========================================
    // BASIC VOTE QUERIES
    // ==========================================

    /**
     * Find a specific vote by resolver and participation.
     */
    Optional<PredictionResolutionVote> findByBetAndResolverAndParticipationAndIsActiveTrue(
            Bet bet, User resolver, BetParticipation participation);

    /**
     * Find all active votes for a bet.
     */
    List<PredictionResolutionVote> findByBetAndIsActiveTrue(Bet bet);

    /**
     * Find all active votes by a resolver for a bet.
     */
    List<PredictionResolutionVote> findByBetAndResolverAndIsActiveTrue(Bet bet, User resolver);

    /**
     * Find all active votes for a specific participation.
     */
    List<PredictionResolutionVote> findByParticipationAndIsActiveTrue(BetParticipation participation);

    // ==========================================
    // EXISTENCE CHECKS
    // ==========================================

    /**
     * Check if resolver has voted on a specific participation.
     */
    boolean existsByBetAndResolverAndParticipationAndIsActiveTrue(
            Bet bet, User resolver, BetParticipation participation);

    /**
     * Check if resolver has voted on any participation in this bet.
     */
    boolean existsByBetAndResolverAndIsActiveTrue(Bet bet, User resolver);

    // ==========================================
    // COUNT QUERIES
    // ==========================================

    /**
     * Count total active votes for a bet.
     */
    @Query("SELECT COUNT(prv) FROM PredictionResolutionVote prv WHERE prv.bet = :bet AND prv.isActive = true")
    Long countActiveVotesByBet(@Param("bet") Bet bet);

    /**
     * Count votes by a specific resolver for a bet.
     */
    @Query("SELECT COUNT(prv) FROM PredictionResolutionVote prv WHERE prv.bet = :bet AND prv.resolver = :resolver AND prv.isActive = true")
    Long countVotesByResolverForBet(@Param("bet") Bet bet, @Param("resolver") User resolver);

    /**
     * Count "correct" votes for a specific participation.
     */
    @Query("SELECT COUNT(prv) FROM PredictionResolutionVote prv WHERE prv.participation = :participation AND prv.isCorrect = true AND prv.isActive = true")
    Long countCorrectVotesForParticipation(@Param("participation") BetParticipation participation);

    /**
     * Count "incorrect" votes for a specific participation.
     */
    @Query("SELECT COUNT(prv) FROM PredictionResolutionVote prv WHERE prv.participation = :participation AND prv.isCorrect = false AND prv.isActive = true")
    Long countIncorrectVotesForParticipation(@Param("participation") BetParticipation participation);

    /**
     * Count total votes for a specific participation.
     */
    @Query("SELECT COUNT(prv) FROM PredictionResolutionVote prv WHERE prv.participation = :participation AND prv.isActive = true")
    Long countTotalVotesForParticipation(@Param("participation") BetParticipation participation);

    // ==========================================
    // VOTE DISTRIBUTION QUERIES
    // ==========================================

    /**
     * Get vote distribution (correct vs incorrect) for all participations in a bet.
     * Returns: [participationId, correctCount, incorrectCount]
     */
    @Query("SELECT prv.participation.id, " +
           "SUM(CASE WHEN prv.isCorrect = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN prv.isCorrect = false THEN 1 ELSE 0 END) " +
           "FROM PredictionResolutionVote prv " +
           "WHERE prv.bet = :bet AND prv.isActive = true " +
           "GROUP BY prv.participation.id")
    List<Object[]> getVoteDistributionByBet(@Param("bet") Bet bet);

    /**
     * Get vote counts for a specific participation.
     * Returns: [correctCount, incorrectCount]
     */
    @Query("SELECT " +
           "SUM(CASE WHEN prv.isCorrect = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN prv.isCorrect = false THEN 1 ELSE 0 END) " +
           "FROM PredictionResolutionVote prv " +
           "WHERE prv.participation = :participation AND prv.isActive = true")
    Object[] getVoteCountsForParticipation(@Param("participation") BetParticipation participation);

    // ==========================================
    // RESOLVER PROGRESS QUERIES
    // ==========================================

    /**
     * Count distinct resolvers who have voted on a bet.
     */
    @Query("SELECT COUNT(DISTINCT prv.resolver) FROM PredictionResolutionVote prv WHERE prv.bet = :bet AND prv.isActive = true")
    Long countDistinctResolversWhoVoted(@Param("bet") Bet bet);

    /**
     * Get list of resolvers who have voted on a bet.
     */
    @Query("SELECT DISTINCT prv.resolver FROM PredictionResolutionVote prv WHERE prv.bet = :bet AND prv.isActive = true")
    List<User> findResolversWhoVoted(@Param("bet") Bet bet);

    /**
     * Count participations a resolver has voted on for a bet.
     */
    @Query("SELECT COUNT(DISTINCT prv.participation) FROM PredictionResolutionVote prv WHERE prv.bet = :bet AND prv.resolver = :resolver AND prv.isActive = true")
    Long countParticipationsVotedByResolver(@Param("bet") Bet bet, @Param("resolver") User resolver);

    // ==========================================
    // VALIDATION QUERIES
    // ==========================================

    /**
     * Check if resolver is trying to vote on their own participation.
     */
    @Query("SELECT CASE WHEN bp.user.id = :resolverId THEN true ELSE false END FROM BetParticipation bp WHERE bp.id = :participationId")
    Boolean isResolverVotingOnSelf(@Param("participationId") Long participationId, @Param("resolverId") Long resolverId);

    // ==========================================
    // BATCH QUERIES
    // ==========================================

    /**
     * Find all votes by bet ID (useful for resolution at deadline).
     */
    @Query("SELECT prv FROM PredictionResolutionVote prv WHERE prv.bet.id = :betId AND prv.isActive = true")
    List<PredictionResolutionVote> findAllActiveVotesByBetId(@Param("betId") Long betId);

    /**
     * Delete all votes for a bet (used when bet is cancelled).
     */
    void deleteByBet(Bet bet);
}

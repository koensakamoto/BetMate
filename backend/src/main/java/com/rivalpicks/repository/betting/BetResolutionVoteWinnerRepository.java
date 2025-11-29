package com.rivalpicks.repository.betting;

import com.rivalpicks.entity.betting.Bet;
import com.rivalpicks.entity.betting.BetResolutionVote;
import com.rivalpicks.entity.betting.BetResolutionVoteWinner;
import com.rivalpicks.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BetResolutionVoteWinnerRepository extends JpaRepository<BetResolutionVoteWinner, Long> {

    // Basic queries
    List<BetResolutionVoteWinner> findByVote(BetResolutionVote vote);
    List<BetResolutionVoteWinner> findByWinnerUser(User winnerUser);

    // Delete by vote (for updating votes)
    void deleteByVote(BetResolutionVote vote);

    // Get winner user IDs for a specific vote
    @Query("SELECT brvw.winnerUser.id FROM BetResolutionVoteWinner brvw WHERE brvw.vote = :vote")
    List<Long> findWinnerUserIdsByVote(@Param("vote") BetResolutionVote vote);

    // Get winner user IDs for a vote by vote ID
    @Query("SELECT brvw.winnerUser.id FROM BetResolutionVoteWinner brvw WHERE brvw.vote.id = :voteId")
    List<Long> findWinnerUserIdsByVoteId(@Param("voteId") Long voteId);

    // Get all winner votes for a bet (across all resolution votes)
    @Query("SELECT brvw FROM BetResolutionVoteWinner brvw " +
           "WHERE brvw.vote.bet = :bet AND brvw.vote.isActive = true AND brvw.vote.revokedAt IS NULL")
    List<BetResolutionVoteWinner> findAllWinnerVotesForBet(@Param("bet") Bet bet);

    // Get all winner user IDs for a bet (across all resolution votes)
    @Query("SELECT brvw.winnerUser.id FROM BetResolutionVoteWinner brvw " +
           "WHERE brvw.vote.bet = :bet AND brvw.vote.isActive = true AND brvw.vote.revokedAt IS NULL")
    List<Long> findAllWinnerUserIdsForBet(@Param("bet") Bet bet);

    // Count how many resolvers selected a specific user as winner
    @Query("SELECT COUNT(DISTINCT brvw.vote.id) FROM BetResolutionVoteWinner brvw " +
           "WHERE brvw.vote.bet = :bet AND brvw.winnerUser.id = :userId " +
           "AND brvw.vote.isActive = true AND brvw.vote.revokedAt IS NULL")
    Long countVotesForWinner(@Param("bet") Bet bet, @Param("userId") Long userId);

    // Get winner vote distribution (user ID -> vote count) for consensus calculation
    @Query("SELECT brvw.winnerUser.id, COUNT(DISTINCT brvw.vote.id) " +
           "FROM BetResolutionVoteWinner brvw " +
           "WHERE brvw.vote.bet = :bet AND brvw.vote.isActive = true AND brvw.vote.revokedAt IS NULL " +
           "GROUP BY brvw.winnerUser.id")
    List<Object[]> getWinnerVoteDistributionForBet(@Param("bet") Bet bet);

    // Check if a user was selected as winner in any vote for a bet
    @Query("SELECT COUNT(brvw) > 0 FROM BetResolutionVoteWinner brvw " +
           "WHERE brvw.vote.bet = :bet AND brvw.winnerUser.id = :userId " +
           "AND brvw.vote.isActive = true AND brvw.vote.revokedAt IS NULL")
    boolean isUserSelectedAsWinnerForBet(@Param("bet") Bet bet, @Param("userId") Long userId);

    // Count total votes that have winner selections (for PREDICTION bets)
    @Query("SELECT COUNT(DISTINCT brvw.vote.id) FROM BetResolutionVoteWinner brvw " +
           "WHERE brvw.vote.bet = :bet AND brvw.vote.isActive = true AND brvw.vote.revokedAt IS NULL")
    Long countVotesWithWinnerSelectionsForBet(@Param("bet") Bet bet);
}

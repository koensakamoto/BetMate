package com.rivalpicks.repository.betting;

import com.rivalpicks.entity.betting.BetFulfillment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing BetFulfillment entities.
 * Tracks individual winner confirmations for social bets.
 */
@Repository
public interface BetFulfillmentRepository extends JpaRepository<BetFulfillment, Long> {

    /**
     * Find all fulfillment confirmations for a specific bet.
     *
     * @param betId the ID of the bet
     * @return list of all fulfillment confirmations for this bet
     */
    List<BetFulfillment> findByBetId(Long betId);

    /**
     * Check if a specific winner has already confirmed fulfillment for a bet.
     *
     * @param betId the ID of the bet
     * @param winnerId the ID of the winner
     * @return true if this winner has already confirmed, false otherwise
     */
    boolean existsByBetIdAndWinnerId(Long betId, Long winnerId);

    /**
     * Count how many winners have confirmed fulfillment for a bet.
     *
     * @param betId the ID of the bet
     * @return number of winners who have confirmed
     */
    long countByBetId(Long betId);
}

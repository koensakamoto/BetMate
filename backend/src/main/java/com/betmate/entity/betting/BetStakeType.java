package com.betmate.entity.betting;

/**
 * Enum representing the type of stake in a bet.
 *
 * CREDIT: Bet requires in-game credits to participate
 * SOCIAL: Bet is for fun/social purposes with no credits involved (e.g., "Loser buys pizza")
 */
public enum BetStakeType {
    /**
     * Credit-based betting - uses in-game credits
     * Requires fixedStakeAmount to be set
     * Credits are deducted when joining and distributed when bet resolves
     */
    CREDIT,

    /**
     * Social betting - no credits involved
     * Requires socialStakeDescription to be set
     * No credit transactions occur
     */
    SOCIAL
}

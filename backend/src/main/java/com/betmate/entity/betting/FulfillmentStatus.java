package com.betmate.entity.betting;

/**
 * Enum representing the fulfillment status of a social bet.
 * Tracks whether all winners have confirmed receipt of their stakes.
 */
public enum FulfillmentStatus {
    /**
     * No winners have confirmed fulfillment yet.
     */
    PENDING,

    /**
     * Some but not all winners have confirmed fulfillment.
     */
    PARTIALLY_FULFILLED,

    /**
     * All winners have confirmed fulfillment - bet is fully settled.
     */
    FULFILLED
}

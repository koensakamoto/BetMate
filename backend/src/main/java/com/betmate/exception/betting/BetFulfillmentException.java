package com.betmate.exception.betting;

/**
 * Exception thrown when a bet fulfillment operation cannot be completed.
 */
public class BetFulfillmentException extends RuntimeException {

    public BetFulfillmentException(String message) {
        super(message);
    }

    public BetFulfillmentException(String message, Throwable cause) {
        super(message, cause);
    }
}

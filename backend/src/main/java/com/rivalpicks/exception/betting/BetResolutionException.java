package com.rivalpicks.exception.betting;

/**
 * Exception thrown when a bet resolution operation cannot be completed.
 */
public class BetResolutionException extends RuntimeException {
    
    public BetResolutionException(String message) {
        super(message);
    }
    
    public BetResolutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
package com.circlebet.exception.betting;

/**
 * Exception thrown when a bet is not found.
 */
public class BetNotFoundException extends RuntimeException {
    
    public BetNotFoundException(String message) {
        super(message);
    }
    
    public BetNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
package com.betmate.exception.betting;

/**
 * Exception thrown when a bet operation cannot be completed.
 */
public class BetOperationException extends RuntimeException {
    
    public BetOperationException(String message) {
        super(message);
    }
    
    public BetOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
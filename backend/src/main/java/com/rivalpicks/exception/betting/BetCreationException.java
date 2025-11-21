package com.rivalpicks.exception.betting;

/**
 * Exception thrown when a bet creation operation cannot be completed.
 */
public class BetCreationException extends RuntimeException {
    
    public BetCreationException(String message) {
        super(message);
    }
    
    public BetCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}
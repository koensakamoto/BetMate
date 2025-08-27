package com.circlebet.exception.betting;

/**
 * Exception thrown when a bet participation operation cannot be completed.
 */
public class BetParticipationException extends RuntimeException {
    
    public BetParticipationException(String message) {
        super(message);
    }
    
    public BetParticipationException(String message, Throwable cause) {
        super(message, cause);
    }
}
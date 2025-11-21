package com.rivalpicks.exception.user;

/**
 * Exception thrown when user has insufficient frozen credits for unfreezing.
 */
public class InsufficientFrozenCreditsException extends RuntimeException {
    
    public InsufficientFrozenCreditsException(String message) {
        super(message);
    }
    
    public InsufficientFrozenCreditsException(String message, Throwable cause) {
        super(message, cause);
    }
}
package com.rivalpicks.exception.user;

/**
 * Exception thrown when user has insufficient credits for an operation.
 */
public class InsufficientCreditsException extends RuntimeException {
    
    public InsufficientCreditsException(String message) {
        super(message);
    }
    
    public InsufficientCreditsException(String message, Throwable cause) {
        super(message, cause);
    }
}
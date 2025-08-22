package com.circlebet.exception.store;

/**
 * Exception thrown when a store operation cannot be completed.
 */
public class StoreOperationException extends RuntimeException {
    
    public StoreOperationException(String message) {
        super(message);
    }
    
    public StoreOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
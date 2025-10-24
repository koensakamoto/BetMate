package com.betmate.exception.store;

/**
 * Exception thrown when a store item is not found.
 */
public class StoreItemNotFoundException extends RuntimeException {
    
    public StoreItemNotFoundException(String message) {
        super(message);
    }
    
    public StoreItemNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
package com.betmate.exception.store;

/**
 * Exception thrown when a store management operation cannot be completed.
 */
public class StoreManagementException extends RuntimeException {
    
    public StoreManagementException(String message) {
        super(message);
    }
    
    public StoreManagementException(String message, Throwable cause) {
        super(message, cause);
    }
}
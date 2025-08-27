package com.circlebet.exception.user;

/**
 * Exception thrown when a user inventory operation cannot be completed.
 */
public class UserInventoryException extends RuntimeException {
    
    public UserInventoryException(String message) {
        super(message);
    }
    
    public UserInventoryException(String message, Throwable cause) {
        super(message, cause);
    }
}
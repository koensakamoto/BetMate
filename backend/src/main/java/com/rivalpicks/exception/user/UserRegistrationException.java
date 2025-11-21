package com.rivalpicks.exception.user;

/**
 * Exception thrown when a user registration operation cannot be completed.
 */
public class UserRegistrationException extends RuntimeException {
    
    public UserRegistrationException(String message) {
        super(message);
    }
    
    public UserRegistrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
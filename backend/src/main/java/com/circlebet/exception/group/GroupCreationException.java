package com.circlebet.exception.group;

/**
 * Exception thrown when group creation fails.
 */
public class GroupCreationException extends RuntimeException {
    
    public GroupCreationException(String message) {
        super(message);
    }
    
    public GroupCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}
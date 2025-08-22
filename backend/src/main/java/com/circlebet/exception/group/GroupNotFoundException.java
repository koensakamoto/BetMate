package com.circlebet.exception.group;

/**
 * Exception thrown when a group is not found.
 */
public class GroupNotFoundException extends RuntimeException {
    
    public GroupNotFoundException(String message) {
        super(message);
    }
    
    public GroupNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
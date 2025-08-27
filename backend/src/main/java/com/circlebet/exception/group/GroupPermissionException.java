package com.circlebet.exception.group;

/**
 * Exception thrown when a user lacks required permissions for a group operation.
 */
public class GroupPermissionException extends RuntimeException {
    
    public GroupPermissionException(String message) {
        super(message);
    }
    
    public GroupPermissionException(String message, Throwable cause) {
        super(message, cause);
    }
}
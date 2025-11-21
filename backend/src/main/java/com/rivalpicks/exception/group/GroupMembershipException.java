package com.rivalpicks.exception.group;

/**
 * Exception thrown when a group membership operation cannot be completed.
 */
public class GroupMembershipException extends RuntimeException {
    
    public GroupMembershipException(String message) {
        super(message);
    }
    
    public GroupMembershipException(String message, Throwable cause) {
        super(message, cause);
    }
}
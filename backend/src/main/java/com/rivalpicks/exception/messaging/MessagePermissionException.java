package com.rivalpicks.exception.messaging;

/**
 * Exception thrown when a user lacks permission to perform a message operation.
 */
public class MessagePermissionException extends RuntimeException {
    
    public MessagePermissionException(String message) {
        super(message);
    }
    
    public MessagePermissionException(String message, Throwable cause) {
        super(message, cause);
    }
}
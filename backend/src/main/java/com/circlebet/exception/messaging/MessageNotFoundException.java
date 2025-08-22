package com.circlebet.exception.messaging;

/**
 * Exception thrown when a message is not found.
 */
public class MessageNotFoundException extends RuntimeException {
    
    public MessageNotFoundException(String message) {
        super(message);
    }
    
    public MessageNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
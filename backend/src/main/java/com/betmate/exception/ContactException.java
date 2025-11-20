package com.betmate.exception;

/**
 * Exception thrown when contact/support operations fail.
 */
public class ContactException extends RuntimeException {

    public ContactException(String message) {
        super(message);
    }

    public ContactException(String message, Throwable cause) {
        super(message, cause);
    }
}

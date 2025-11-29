package com.rivalpicks.exception.user;

/**
 * Exception thrown when a user registration operation cannot be completed.
 */
public class UserRegistrationException extends RuntimeException {

    public enum ErrorCode {
        USERNAME_TAKEN,
        USERNAME_INVALID_FORMAT,
        EMAIL_ALREADY_EXISTS,
        EMAIL_INVALID_FORMAT,
        PASSWORD_TOO_WEAK,
        VALIDATION_ERROR
    }

    private final ErrorCode errorCode;

    public UserRegistrationException(String message) {
        super(message);
        this.errorCode = ErrorCode.VALIDATION_ERROR;
    }

    public UserRegistrationException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public UserRegistrationException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = ErrorCode.VALIDATION_ERROR;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
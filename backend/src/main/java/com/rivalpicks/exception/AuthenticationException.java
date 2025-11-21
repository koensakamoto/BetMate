package com.rivalpicks.exception;

/**
 * Base exception for authentication-related failures.
 */
public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Exception thrown when account is temporarily locked due to failed login attempts.
     */
    public static class AccountLockedException extends AuthenticationException {
        public AccountLockedException(String message) {
            super(message);
        }
    }

    /**
     * Exception thrown when account is inactive or deleted.
     */
    public static class InactiveAccountException extends AuthenticationException {
        public InactiveAccountException(String message) {
            super(message);
        }
    }

    /**
     * Exception thrown when credentials are invalid.
     */
    public static class InvalidCredentialsException extends AuthenticationException {
        public InvalidCredentialsException(String message) {
            super(message);
        }
    }

    /**
     * Exception thrown when email verification is required.
     */
    public static class EmailVerificationRequiredException extends AuthenticationException {
        public EmailVerificationRequiredException(String message) {
            super(message);
        }
    }
}
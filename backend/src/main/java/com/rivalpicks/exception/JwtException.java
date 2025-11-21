package com.rivalpicks.exception;

/**
 * Base exception for JWT-related operations.
 */
public class JwtException extends RuntimeException {
    public JwtException(String message) {
        super(message);
    }

    public JwtException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Exception thrown when JWT token has expired.
     */
    public static class ExpiredTokenException extends JwtException {
        public ExpiredTokenException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * Exception thrown when JWT token is malformed.
     */
    public static class MalformedTokenException extends JwtException {
        public MalformedTokenException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * Exception thrown when JWT token signature is invalid.
     */
    public static class InvalidSignatureException extends JwtException {
        public InvalidSignatureException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * Exception thrown when JWT token is unsupported.
     */
    public static class UnsupportedTokenException extends JwtException {
        public UnsupportedTokenException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * Exception thrown when JWT token is invalid or missing required claims.
     */
    public static class InvalidTokenException extends JwtException {
        public InvalidTokenException(String message, Throwable cause) {
            super(message, cause);
        }

        public InvalidTokenException(String message) {
            super(message);
        }
    }
}
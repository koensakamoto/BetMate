package com.betmate.validation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

/**
 * Utility class for input validation and sanitization.
 * Provides security-focused validation for authentication inputs.
 */
@Component
public class InputValidator {

    private static final Logger log = LoggerFactory.getLogger(InputValidator.class);
    
    // Password policy constants
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 128;
    private static final int MAX_USERNAME_LENGTH = 50;
    private static final int MAX_EMAIL_LENGTH = 254;
    
    // Regex patterns for validation
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );
    
    private static final Pattern USERNAME_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._-]+$"
    );
    
    // Password strength patterns
    private static final Pattern HAS_UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern HAS_LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern HAS_DIGIT = Pattern.compile("\\d");
    private static final Pattern HAS_SPECIAL_CHAR = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");
    
    // Dangerous patterns to detect potential attacks
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript)",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Validates and sanitizes a password for security requirements.
     */
    public PasswordValidationResult validatePassword(String password) {
        if (password == null) {
            return PasswordValidationResult.invalid("Password cannot be null");
        }
        
        // Trim whitespace
        password = password.trim();
        
        if (password.isEmpty()) {
            return PasswordValidationResult.invalid("Password cannot be empty");
        }
        
        if (password.length() < MIN_PASSWORD_LENGTH) {
            return PasswordValidationResult.invalid(
                String.format("Password must be at least %d characters long", MIN_PASSWORD_LENGTH)
            );
        }
        
        if (password.length() > MAX_PASSWORD_LENGTH) {
            return PasswordValidationResult.invalid(
                String.format("Password cannot exceed %d characters", MAX_PASSWORD_LENGTH)
            );
        }
        
        // Check for required character types
        int strengthScore = 0;
        StringBuilder requirements = new StringBuilder();
        
        if (!HAS_LOWERCASE.matcher(password).find()) {
            requirements.append("lowercase letter, ");
        } else {
            strengthScore++;
        }
        
        if (!HAS_UPPERCASE.matcher(password).find()) {
            requirements.append("uppercase letter, ");
        } else {
            strengthScore++;
        }
        
        if (!HAS_DIGIT.matcher(password).find()) {
            requirements.append("number, ");
        } else {
            strengthScore++;
        }
        
        if (!HAS_SPECIAL_CHAR.matcher(password).find()) {
            requirements.append("special character, ");
        } else {
            strengthScore++;
        }
        
        // Require at least 3 out of 4 character types
        if (strengthScore < 3) {
            String missing = requirements.toString().replaceAll(", $", "");
            return PasswordValidationResult.invalid(
                "Password must contain at least 3 of the following: " + missing
            );
        }
        
        // Check for common weak patterns
        if (isWeakPassword(password)) {
            return PasswordValidationResult.invalid("Password is too common or predictable");
        }
        
        return PasswordValidationResult.valid();
    }

    /**
     * Sanitizes and validates username input.
     */
    public InputValidationResult validateUsername(String username) {
        if (!StringUtils.hasText(username)) {
            return InputValidationResult.invalid("Username cannot be empty");
        }
        
        String sanitized = sanitizeInput(username.trim());
        
        if (sanitized.length() > MAX_USERNAME_LENGTH) {
            return InputValidationResult.invalid(
                String.format("Username cannot exceed %d characters", MAX_USERNAME_LENGTH)
            );
        }
        
        if (!USERNAME_PATTERN.matcher(sanitized).matches()) {
            return InputValidationResult.invalid(
                "Username can only contain letters, numbers, dots, underscores, and hyphens"
            );
        }
        
        if (containsSuspiciousContent(sanitized)) {
            log.warn("Suspicious username attempted: {}", sanitized);
            return InputValidationResult.invalid("Invalid username format");
        }
        
        return InputValidationResult.valid(sanitized);
    }

    /**
     * Validates email format and sanitizes input.
     */
    public InputValidationResult validateEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return InputValidationResult.invalid("Email cannot be empty");
        }
        
        String sanitized = sanitizeInput(email.trim().toLowerCase());
        
        if (sanitized.length() > MAX_EMAIL_LENGTH) {
            return InputValidationResult.invalid(
                String.format("Email cannot exceed %d characters", MAX_EMAIL_LENGTH)
            );
        }
        
        if (!EMAIL_PATTERN.matcher(sanitized).matches()) {
            return InputValidationResult.invalid("Invalid email format");
        }
        
        if (containsSuspiciousContent(sanitized)) {
            log.warn("Suspicious email attempted: {}", sanitized);
            return InputValidationResult.invalid("Invalid email format");
        }
        
        return InputValidationResult.valid(sanitized);
    }

    /**
     * General input sanitization to prevent injection attacks.
     */
    public String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        
        return input.trim()
            .replaceAll("[\r\n\t]", "") // Remove line breaks and tabs
            .replaceAll("\\p{Cntrl}", ""); // Remove control characters
    }

    /**
     * Checks for suspicious content that might indicate an attack.
     */
    private boolean containsSuspiciousContent(String input) {
        if (input == null) {
            return false;
        }
        
        String lowerInput = input.toLowerCase();
        
        // Check for SQL injection patterns
        if (SQL_INJECTION_PATTERN.matcher(lowerInput).find()) {
            return true;
        }
        
        // Check for script injection patterns
        if (lowerInput.contains("<script") || lowerInput.contains("javascript:") || 
            lowerInput.contains("vbscript:") || lowerInput.contains("onload=") ||
            lowerInput.contains("onerror=")) {
            return true;
        }
        
        return false;
    }

    /**
     * Checks for common weak password patterns.
     */
    private boolean isWeakPassword(String password) {
        String lower = password.toLowerCase();
        
        // Common weak passwords
        String[] weakPasswords = {
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "dragon", "master"
        };
        
        for (String weak : weakPasswords) {
            if (lower.contains(weak)) {
                return true;
            }
        }
        
        // Sequential patterns
        if (lower.matches(".*123.*") || lower.matches(".*abc.*") || 
            lower.matches(".*qwe.*") || lower.matches(".*asd.*")) {
            return true;
        }
        
        // Repeated characters
        if (password.matches(".*(.)\\1{2,}.*")) {
            return true;
        }
        
        return false;
    }

    // Result classes for validation responses
    public static class PasswordValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private PasswordValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static PasswordValidationResult valid() {
            return new PasswordValidationResult(true, null);
        }

        public static PasswordValidationResult invalid(String errorMessage) {
            return new PasswordValidationResult(false, errorMessage);
        }

        public boolean isValid() { return valid; }
        public String getErrorMessage() { return errorMessage; }
    }

    public static class InputValidationResult {
        private final boolean valid;
        private final String sanitizedValue;
        private final String errorMessage;

        private InputValidationResult(boolean valid, String sanitizedValue, String errorMessage) {
            this.valid = valid;
            this.sanitizedValue = sanitizedValue;
            this.errorMessage = errorMessage;
        }

        public static InputValidationResult valid(String sanitizedValue) {
            return new InputValidationResult(true, sanitizedValue, null);
        }

        public static InputValidationResult invalid(String errorMessage) {
            return new InputValidationResult(false, null, errorMessage);
        }

        public boolean isValid() { return valid; }
        public String getSanitizedValue() { return sanitizedValue; }
        public String getErrorMessage() { return errorMessage; }
    }
}
package com.circlebet.exception;

import com.circlebet.service.user.UserService;
import com.circlebet.dto.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for centralized error handling across all controllers.
 * Provides consistent error responses and logging for different exception types.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Helper method to create ErrorResponse with common fields.
     */
    private ApiResponse<Void> createErrorResponse(HttpStatus status, String error, String message, String path) {
        return ApiResponse.error(error, message, status.value(), path);
    }

    /**
     * Handles authentication-related exceptions.
     */
    @ExceptionHandler({
        AuthenticationException.InvalidCredentialsException.class,
        BadCredentialsException.class,
        UsernameNotFoundException.class
    })
    public ApiResponse<Void> handleAuthenticationExceptions(RuntimeException ex, HttpServletRequest request) {
        log.warn("Authentication failed for request {}: {}", request.getRequestURI(), ex.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, "Authentication Failed", "Invalid credentials", request.getRequestURI());
    }

    /**
     * Handles account locked exceptions.
     */
    @ExceptionHandler(AuthenticationException.AccountLockedException.class)
    public ApiResponse<Void> handleAccountLockedException(
            AuthenticationException.AccountLockedException ex, HttpServletRequest request) {
        log.warn("Account locked attempt for request {}: {}", request.getRequestURI(), ex.getMessage());
        return createErrorResponse(HttpStatus.LOCKED, "Account Locked", ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles inactive account exceptions.
     */
    @ExceptionHandler(AuthenticationException.InactiveAccountException.class)
    public ApiResponse<Void> handleInactiveAccountException(
            AuthenticationException.InactiveAccountException ex, HttpServletRequest request) {
        log.warn("Inactive account access attempt for request {}: {}", request.getRequestURI(), ex.getMessage());
        return createErrorResponse(HttpStatus.FORBIDDEN, "Account Inactive", ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles JWT token exceptions.
     */
    @ExceptionHandler({
        JwtException.ExpiredTokenException.class,
        JwtException.InvalidSignatureException.class,
        JwtException.InvalidTokenException.class
    })
    public ApiResponse<Void> handleJwtExceptions(JwtException ex, HttpServletRequest request) {
        log.warn("JWT token error for request {}: {}", request.getRequestURI(), ex.getMessage());
        return createErrorResponse(HttpStatus.UNAUTHORIZED, "Token Error", ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles malformed JWT token exceptions.
     */
    @ExceptionHandler(JwtException.MalformedTokenException.class)
    public ApiResponse<Void> handleMalformedTokenException(
            JwtException.MalformedTokenException ex, HttpServletRequest request) {
        log.warn("Malformed JWT token for request: {} - {}", request.getRequestURI(), ex.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "Malformed Token", "JWT token is malformed", request.getRequestURI());
    }

    /**
     * Handles user not found exceptions.
     */
    @ExceptionHandler(UserService.UserNotFoundException.class)
    public ApiResponse<Void> handleUserNotFoundException(
            UserService.UserNotFoundException ex, HttpServletRequest request) {
        log.warn("User not found for request {}: {}", request.getRequestURI(), ex.getMessage());
        return createErrorResponse(HttpStatus.NOT_FOUND, "User Not Found", "User not found", request.getRequestURI());
    }

    /**
     * Handles validation exceptions from @Valid annotations.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        
        log.warn("Validation failed for request {}: {} validation errors", 
                request.getRequestURI(), ex.getBindingResult().getErrorCount());
        
        Map<String, Object> errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fieldError -> Map.of(
                    "message", fieldError.getDefaultMessage() != null ? fieldError.getDefaultMessage() : "Invalid value",
                    "rejectedValue", fieldError.getRejectedValue() != null ? fieldError.getRejectedValue() : "null"
                )
            ));
        
        return ApiResponse.validationError("Request validation failed", errors, request.getRequestURI());
    }

    /**
     * Handles constraint violation exceptions.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ApiResponse<Void> handleConstraintViolationException(
            ConstraintViolationException ex, HttpServletRequest request) {
        log.warn("Constraint violation for request {}: {}", request.getRequestURI(), ex.getMessage());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "Constraint Violation", "Request validation failed", request.getRequestURI());
    }

    /**
     * Handles method argument type mismatch exceptions.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ApiResponse<Void> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        log.warn("Method argument type mismatch for request {}: {}", request.getRequestURI(), ex.getMessage());
        String message = String.format("Invalid value '%s' for parameter '%s'", ex.getValue(), ex.getName());
        return createErrorResponse(HttpStatus.BAD_REQUEST, "Invalid Parameter", message, request.getRequestURI());
    }

    /**
     * Handles all other unexpected exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error for request {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "An unexpected error occurred", request.getRequestURI());
    }

}
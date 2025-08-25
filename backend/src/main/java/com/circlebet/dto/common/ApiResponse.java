package com.circlebet.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Global API response wrapper for consistent response format across all endpoints.
 * Provides standardized success/error responses with optional data payload.
 */
@Getter
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private final boolean success;
    private final String message;
    private final T data;
    private final String error;
    private final LocalDateTime timestamp;
    private final String path;
    private final Integer status;
    private final Map<String, Object> validationErrors;

    /**
     * Creates a successful response with data payload.
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Creates a successful response with data and custom message.
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Creates a successful response with only a message (no data).
     */
    public static <Void> ApiResponse<Void> success(String message) {
        return ApiResponse.<Void>builder()
            .success(true)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Creates an error response with message and HTTP status.
     */
    public static <Void> ApiResponse<Void> error(String error, String message, int status, String path) {
        return ApiResponse.<Void>builder()
            .success(false)
            .error(error)
            .message(message)
            .status(status)
            .path(path)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Creates a validation error response with field-specific errors.
     */
    public static <Void> ApiResponse<Void> validationError(String message, Map<String, Object> validationErrors, String path) {
        return ApiResponse.<Void>builder()
            .success(false)
            .error("Validation Failed")
            .message(message)
            .status(400)
            .path(path)
            .validationErrors(validationErrors)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Creates an error response with just an error message.
     */
    public static <Void> ApiResponse<Void> error(String message) {
        return ApiResponse.<Void>builder()
            .success(false)
            .error("Error")
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
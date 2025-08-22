package com.circlebet.dto.common;

import java.time.LocalDateTime;

/**
 * Standard error response DTO for API errors.
 */
public class ErrorResponseDto {
    private String message;
    private String code;
    private LocalDateTime timestamp;
    private String path;

    public ErrorResponseDto(String message) {
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public ErrorResponseDto(String message, String code) {
        this.message = message;
        this.code = code;
        this.timestamp = LocalDateTime.now();
    }

    public ErrorResponseDto(String message, String code, String path) {
        this.message = message;
        this.code = code;
        this.path = path;
        this.timestamp = LocalDateTime.now();
    }

    // Getters
    public String getMessage() { return message; }
    public String getCode() { return code; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getPath() { return path; }
}
package com.betmate.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Custom deserializer for LocalDateTime that treats incoming ISO 8601 strings as UTC.
 *
 * Frontend sends dates like "2025-11-20T21:15:00.000Z" which are in UTC.
 * This deserializer ensures they are parsed correctly as UTC and stored as LocalDateTime.
 *
 * When the frontend displays these dates, it should treat them as UTC and convert to local time.
 */
public class UtcDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateString = p.getText();

        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }

        try {
            // Try to parse as ISO 8601 with timezone info (e.g., "2025-11-20T21:15:00.000Z")
            Instant instant = Instant.parse(dateString);
            return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
        } catch (DateTimeParseException e) {
            // Fallback: try parsing as LocalDateTime without timezone
            // This handles strings like "2025-11-20T21:15:00"
            try {
                return LocalDateTime.parse(dateString, ISO_FORMATTER);
            } catch (DateTimeParseException e2) {
                throw new IOException("Unable to parse date: " + dateString, e2);
            }
        }
    }
}

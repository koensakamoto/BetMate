package com.betmate.controller;

import com.betmate.dto.export.DataExportDto;
import com.betmate.service.security.UserDetailsServiceImpl;
import com.betmate.service.user.DataExportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * REST controller for user data export operations.
 * Allows users to download all their personal data.
 */
@RestController
@RequestMapping("/api/users/me")
public class DataExportController {

    private final DataExportService dataExportService;
    private final ObjectMapper objectMapper;

    public DataExportController(DataExportService dataExportService) {
        this.dataExportService = dataExportService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        this.objectMapper.configure(SerializationFeature.INDENT_OUTPUT, true);
    }

    /**
     * Export all user data as a JSON file download.
     *
     * @return JSON file containing all user data
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportUserData() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            DataExportDto exportData = dataExportService.exportUserData(userPrincipal.getUserId());

            byte[] jsonBytes = objectMapper.writeValueAsBytes(exportData);

            String filename = String.format("betmate-data-%s-%s.json",
                userPrincipal.getUsername(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(jsonBytes.length);

            return new ResponseEntity<>(jsonBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get user data export as JSON response (for preview/API usage).
     *
     * @return JSON response containing all user data
     */
    @GetMapping("/export/preview")
    public ResponseEntity<DataExportDto> previewExportData() {
        try {
            UserDetailsServiceImpl.UserPrincipal userPrincipal = getCurrentUser();
            if (userPrincipal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            DataExportDto exportData = dataExportService.exportUserData(userPrincipal.getUserId());
            return ResponseEntity.ok(exportData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private UserDetailsServiceImpl.UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsServiceImpl.UserPrincipal) {
            return (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();
        }
        return null;
    }
}

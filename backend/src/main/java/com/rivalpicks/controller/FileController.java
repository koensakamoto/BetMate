package com.rivalpicks.controller;

import com.rivalpicks.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * REST controller for serving uploaded files.
 * Handles file retrieval for profile pictures and other uploaded content.
 */
@Slf4j
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    @Autowired
    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    /**
     * Serve profile picture files.
     * @param fileName The filename to retrieve
     * @return The image file with appropriate content type
     */
    @GetMapping("/profile-pictures/{fileName:.+}")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable String fileName) {
        try {
            // Security: Validate filename to prevent path traversal attacks
            if (fileName == null || fileName.isEmpty()) {
                log.warn("Empty filename requested");
                return ResponseEntity.badRequest().build();
            }

            // Reject filenames with path traversal sequences
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                log.warn("Path traversal attempt detected in filename: {}", fileName);
                return ResponseEntity.badRequest().build();
            }

            // Get the base storage location and normalize it
            Path baseLocation = fileStorageService.getFileStorageLocation().toAbsolutePath().normalize();

            // Resolve the file path and normalize it
            Path filePath = baseLocation.resolve(fileName).normalize();

            // Security: Ensure the resolved path is still within the base directory
            if (!filePath.startsWith(baseLocation)) {
                log.warn("Path traversal attempt blocked. Requested: {}, Base: {}", filePath, baseLocation);
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType;
            try {
                contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
            } catch (IOException ex) {
                contentType = "application/octet-stream";
            }

            // Security: Sanitize filename in Content-Disposition header
            String safeFilename = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename + "\"")
                .body(resource);
        } catch (Exception ex) {
            log.error("Error serving file: {}", fileName, ex);
            return ResponseEntity.internalServerError().build();
        }
    }
}

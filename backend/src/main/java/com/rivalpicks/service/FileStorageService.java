package com.rivalpicks.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling file storage operations.
 * Manages file uploads, validation, and storage for profile pictures.
 */
@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    public FileStorageService(@Value("${file.upload-dir:uploads/profile-pictures}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory!", ex);
        }
    }

    /**
     * Store a profile picture file
     * @param file The multipart file to store
     * @param userId The user ID for organizing files
     * @return The filename of the stored file
     */
    public String storeProfilePicture(MultipartFile file, Long userId) {
        // Validate file
        validateFile(file);

        // Get original filename and extension
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFileName);

        // Generate unique filename: userId_timestamp_uuid.ext
        String fileName = String.format("user_%d_%d_%s.%s",
            userId,
            System.currentTimeMillis(),
            UUID.randomUUID().toString().substring(0, 8),
            fileExtension
        );

        try {
            // Check for invalid characters
            if (fileName.contains("..")) {
                throw new RuntimeException("Invalid file path: " + fileName);
            }

            // Copy file to target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName, ex);
        }
    }

    /**
     * Store a bet fulfillment proof photo
     * @param file The multipart file to store
     * @param betId The bet ID for organizing files
     * @param userId The user ID for organizing files
     * @return The filename of the stored file
     */
    public String storeFulfillmentProof(MultipartFile file, Long betId, Long userId) {
        // Validate file
        validateFile(file);

        // Get original filename and extension
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFileName);

        // Generate unique filename: bet_betId_userId_timestamp_uuid.ext
        String fileName = String.format("bet_%d_user_%d_%d_%s.%s",
            betId,
            userId,
            System.currentTimeMillis(),
            UUID.randomUUID().toString().substring(0, 8),
            fileExtension
        );

        try {
            // Check for invalid characters
            if (fileName.contains("..")) {
                throw new RuntimeException("Invalid file path: " + fileName);
            }

            // Copy file to target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName, ex);
        }
    }

    /**
     * Delete a profile picture file
     * @param fileName The filename to delete
     */
    public void deleteFile(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }

        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            // Log but don't throw - deletion failure shouldn't block operations
            // Silent failure - deletion is not critical
        }
    }

    /**
     * Validate the uploaded file
     */
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only images are allowed (JPG, PNG, GIF, WebP)");
        }

        // Check file extension
        String fileName = file.getOriginalFilename();
        String extension = getFileExtension(fileName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file extension. Only JPG, PNG, GIF, and WebP are allowed");
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }

        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }

        return fileName.substring(lastDotIndex + 1);
    }

    /**
     * Get the storage location path
     */
    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }
}

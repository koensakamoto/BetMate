package com.rivalpicks.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
 * Local filesystem implementation of StorageService.
 * Used for development when storage.type=local (default).
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final Path fileStorageLocation;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    public LocalStorageService(@Value("${file.upload-dir:uploads/profile-pictures}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory!", ex);
        }
    }

    @Override
    public UploadResult uploadPublicFile(MultipartFile file, String prefix, Long id) {
        return uploadFile(file, prefix, id);
    }

    @Override
    public UploadResult uploadPrivateFile(MultipartFile file, String prefix, Long id) {
        // For local storage, public and private are handled the same way
        return uploadFile(file, prefix, id);
    }

    private UploadResult uploadFile(MultipartFile file, String prefix, Long id) {
        validateFile(file);

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFileName);

        // Generate unique filename: prefix_id_timestamp_uuid.ext
        String fileName = String.format("%s_%d_%d_%s.%s",
                prefix,
                id,
                System.currentTimeMillis(),
                UUID.randomUUID().toString().substring(0, 8),
                fileExtension
        );

        try {
            if (fileName.contains("..")) {
                throw new RuntimeException("Invalid file path: " + fileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // For local storage, return relative URL
            String storedValue = "/api/files/profile-pictures/" + fileName;
            return new UploadResult(storedValue, storedValue);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName, ex);
        }
    }

    @Override
    public String resolveUrl(String storedValue) {
        // For local storage, the stored value is already the URL
        return storedValue;
    }

    @Override
    public void deleteFile(String storedValue) {
        if (storedValue == null || storedValue.isEmpty()) {
            return;
        }

        try {
            // Extract filename from stored URL
            String fileName = storedValue.substring(storedValue.lastIndexOf('/') + 1);
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.warn("Failed to delete file: {}", storedValue, ex);
        }
    }

    @Override
    public void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only images are allowed (JPG, PNG, GIF, WebP)");
        }

        String fileName = file.getOriginalFilename();
        String extension = getFileExtension(fileName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file extension. Only JPG, PNG, GIF, and WebP are allowed");
        }
    }

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
     * Get the storage location path (used by FileController)
     */
    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }
}

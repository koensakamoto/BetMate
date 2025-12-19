package com.rivalpicks.service.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface for file storage operations.
 * Implementations can use local filesystem or cloud storage (R2/S3).
 */
public interface StorageService {

    /**
     * Upload a file to public storage (accessible without authentication).
     * Used for profile pictures.
     *
     * @param file The file to upload
     * @param prefix The storage prefix/folder (e.g., "profiles")
     * @param id The entity ID for organizing files
     * @return UploadResult containing the stored value and display URL
     */
    UploadResult uploadPublicFile(MultipartFile file, String prefix, Long id);

    /**
     * Upload a file to private storage (requires signed URL to access).
     * Used for group pictures and bet fulfillment proofs.
     *
     * @param file The file to upload
     * @param prefix The storage prefix/folder (e.g., "groups", "bets")
     * @param id The entity ID for organizing files
     * @return UploadResult containing the stored value and display URL
     */
    UploadResult uploadPrivateFile(MultipartFile file, String prefix, Long id);

    /**
     * Resolve a stored value to a URL that can be used by the frontend.
     * For local storage, returns the same relative URL.
     * For R2, returns the public URL or generates a signed URL for private files.
     *
     * @param storedValue The value stored in the database
     * @return A URL the frontend can use to load the image
     */
    String resolveUrl(String storedValue);

    /**
     * Delete a file from storage.
     *
     * @param storedValue The stored value to delete
     */
    void deleteFile(String storedValue);

    /**
     * Validate a file before upload.
     *
     * @param file The file to validate
     * @throws IllegalArgumentException if validation fails
     */
    void validateFile(MultipartFile file);
}

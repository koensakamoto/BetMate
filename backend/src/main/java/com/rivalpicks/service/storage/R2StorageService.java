package com.rivalpicks.service.storage;

import com.rivalpicks.config.R2Properties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Cloudflare R2 implementation of StorageService.
 * Used for production when storage.type=r2
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "r2")
public class R2StorageService implements StorageService {

    private static final String PRIVATE_PREFIX = "private:";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final R2Properties r2Properties;

    public R2StorageService(S3Client s3Client, S3Presigner s3Presigner, R2Properties r2Properties) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.r2Properties = r2Properties;
    }

    @Override
    public UploadResult uploadPublicFile(MultipartFile file, String prefix, Long id) {
        validateFile(file);

        String objectKey = generateObjectKey(prefix, id, file.getOriginalFilename());
        String contentType = file.getContentType();

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(r2Properties.getPublicBucket())
                    .key(objectKey)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Public URL: https://pub-xxx.r2.dev/prefix/filename
            String publicUrl = r2Properties.getPublicUrl() + "/" + objectKey;

            log.info("Uploaded public file to R2: {}", objectKey);
            return new UploadResult(publicUrl, publicUrl);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to R2: " + e.getMessage(), e);
        }
    }

    @Override
    public UploadResult uploadPrivateFile(MultipartFile file, String prefix, Long id) {
        validateFile(file);

        String objectKey = generateObjectKey(prefix, id, file.getOriginalFilename());
        String contentType = file.getContentType();

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(r2Properties.getPrivateBucket())
                    .key(objectKey)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Store with private: prefix so we know to generate signed URL later
            String storedValue = PRIVATE_PREFIX + objectKey;
            // Generate signed URL for immediate display
            String signedUrl = generateSignedUrl(objectKey);

            log.info("Uploaded private file to R2: {}", objectKey);
            return new UploadResult(storedValue, signedUrl);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to R2: " + e.getMessage(), e);
        }
    }

    @Override
    public String resolveUrl(String storedValue) {
        if (storedValue == null || storedValue.isEmpty()) {
            return null;
        }

        // If it's a private file, generate a signed URL
        if (storedValue.startsWith(PRIVATE_PREFIX)) {
            String objectKey = storedValue.substring(PRIVATE_PREFIX.length());
            return generateSignedUrl(objectKey);
        }

        // Otherwise, it's already a public URL
        return storedValue;
    }

    @Override
    public void deleteFile(String storedValue) {
        if (storedValue == null || storedValue.isEmpty()) {
            return;
        }

        try {
            String bucket;
            String objectKey;

            if (storedValue.startsWith(PRIVATE_PREFIX)) {
                bucket = r2Properties.getPrivateBucket();
                objectKey = storedValue.substring(PRIVATE_PREFIX.length());
            } else if (storedValue.startsWith(r2Properties.getPublicUrl())) {
                bucket = r2Properties.getPublicBucket();
                objectKey = storedValue.substring(r2Properties.getPublicUrl().length() + 1);
            } else {
                log.warn("Unknown storage format, cannot delete: {}", storedValue);
                return;
            }

            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("Deleted file from R2: bucket={}, key={}", bucket, objectKey);
        } catch (Exception e) {
            log.warn("Failed to delete file from R2: {}", storedValue, e);
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

    private String generateObjectKey(String prefix, Long id, String originalFilename) {
        String extension = getFileExtension(originalFilename);
        return String.format("%s/%s_%d_%d_%s.%s",
                prefix,
                prefix,
                id,
                System.currentTimeMillis(),
                UUID.randomUUID().toString().substring(0, 8),
                extension
        );
    }

    private String generateSignedUrl(String objectKey) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(r2Properties.getPrivateBucket())
                .key(objectKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(r2Properties.getSignedUrlExpirationMinutes()))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
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
}

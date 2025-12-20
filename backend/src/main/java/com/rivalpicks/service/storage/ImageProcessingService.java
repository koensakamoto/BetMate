package com.rivalpicks.service.storage;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for processing images before storage.
 * Handles compression, resizing, and thumbnail generation.
 */
@Slf4j
@Service
public class ImageProcessingService {

    // Size variants for thumbnails
    public static final int THUMB_SIZE = 100;    // For avatars in lists
    public static final int MEDIUM_SIZE = 400;   // For profile headers
    public static final int ORIGINAL_SIZE = 1200; // Max size for original

    // Prefixes for variant filenames
    public static final String THUMB_PREFIX = "thumb_";
    public static final String MEDIUM_PREFIX = "medium_";

    private static final float COMPRESSION_QUALITY = 0.8f;

    /**
     * Process an image: compress and resize to max dimension.
     *
     * @param file The original image file
     * @return Processed image bytes
     */
    public byte[] processImage(MultipartFile file) throws IOException {
        return processImage(file.getInputStream(), ORIGINAL_SIZE);
    }

    /**
     * Process an image with a specific max dimension.
     *
     * @param inputStream The image input stream
     * @param maxDimension Maximum width or height
     * @return Processed image bytes
     */
    public byte[] processImage(InputStream inputStream, int maxDimension) throws IOException {
        BufferedImage originalImage = ImageIO.read(inputStream);
        if (originalImage == null) {
            throw new IOException("Could not read image");
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Get original dimensions
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Calculate new dimensions maintaining aspect ratio
        int newWidth = originalWidth;
        int newHeight = originalHeight;

        if (originalWidth > maxDimension || originalHeight > maxDimension) {
            if (originalWidth > originalHeight) {
                newWidth = maxDimension;
                newHeight = (int) ((double) originalHeight / originalWidth * maxDimension);
            } else {
                newHeight = maxDimension;
                newWidth = (int) ((double) originalWidth / originalHeight * maxDimension);
            }
        }

        // Process with Thumbnailator
        Thumbnails.of(originalImage)
                .size(newWidth, newHeight)
                .outputQuality(COMPRESSION_QUALITY)
                .outputFormat("jpg")
                .toOutputStream(outputStream);

        log.debug("Processed image: {}x{} -> {}x{}, size: {} bytes",
                originalWidth, originalHeight, newWidth, newHeight, outputStream.size());

        return outputStream.toByteArray();
    }

    /**
     * Generate all size variants of an image.
     *
     * @param file The original image file
     * @return Map of variant name to processed bytes (keys: "thumb", "medium", "original")
     */
    public Map<String, byte[]> generateVariants(MultipartFile file) throws IOException {
        Map<String, byte[]> variants = new HashMap<>();

        // Read original image once
        byte[] originalBytes = file.getBytes();

        // Generate thumbnail (100px)
        variants.put("thumb", processImage(new ByteArrayInputStream(originalBytes), THUMB_SIZE));

        // Generate medium (400px)
        variants.put("medium", processImage(new ByteArrayInputStream(originalBytes), MEDIUM_SIZE));

        // Generate compressed original (1200px max)
        variants.put("original", processImage(new ByteArrayInputStream(originalBytes), ORIGINAL_SIZE));

        log.info("Generated {} image variants", variants.size());
        return variants;
    }

    /**
     * Get the variant filename prefix.
     *
     * @param variant The variant type (thumb, medium, original)
     * @return The filename prefix
     */
    public String getVariantPrefix(String variant) {
        return switch (variant) {
            case "thumb" -> THUMB_PREFIX;
            case "medium" -> MEDIUM_PREFIX;
            default -> "";
        };
    }

    /**
     * Get the content type for processed images (always JPEG).
     */
    public String getProcessedContentType() {
        return "image/jpeg";
    }

    /**
     * Get the file extension for processed images.
     */
    public String getProcessedExtension() {
        return "jpg";
    }
}

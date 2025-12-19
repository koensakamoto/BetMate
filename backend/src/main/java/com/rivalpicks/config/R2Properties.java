package com.rivalpicks.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for Cloudflare R2 storage.
 */
@Data
@Component
@ConfigurationProperties(prefix = "r2")
public class R2Properties {

    /**
     * Cloudflare account ID
     */
    private String accountId;

    /**
     * R2 access key ID
     */
    private String accessKeyId;

    /**
     * R2 secret access key
     */
    private String secretAccessKey;

    /**
     * Name of the public bucket (for profile pictures)
     */
    private String publicBucket;

    /**
     * Name of the private bucket (for group pictures, bet proofs)
     */
    private String privateBucket;

    /**
     * Public URL for the public bucket (e.g., https://pub-xxx.r2.dev)
     */
    private String publicUrl;

    /**
     * Expiration time for signed URLs in minutes
     */
    private int signedUrlExpirationMinutes = 60;

    /**
     * Get the S3-compatible endpoint URL for R2
     */
    public String getEndpointUrl() {
        return String.format("https://%s.r2.cloudflarestorage.com", accountId);
    }
}

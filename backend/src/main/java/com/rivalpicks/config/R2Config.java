package com.rivalpicks.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Configuration for Cloudflare R2 storage.
 * Only active when storage.type=r2
 */
@Configuration
@ConditionalOnProperty(name = "storage.type", havingValue = "r2")
public class R2Config {

    @Bean
    public S3Client s3Client(R2Properties properties) {
        return S3Client.builder()
                .endpointOverride(URI.create(properties.getEndpointUrl()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(
                                properties.getAccessKeyId(),
                                properties.getSecretAccessKey()
                        )
                ))
                .region(Region.of("auto"))
                .forcePathStyle(true)
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(R2Properties properties) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(properties.getEndpointUrl()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(
                                properties.getAccessKeyId(),
                                properties.getSecretAccessKey()
                        )
                ))
                .region(Region.of("auto"))
                .build();
    }
}

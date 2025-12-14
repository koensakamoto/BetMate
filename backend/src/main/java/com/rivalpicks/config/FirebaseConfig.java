package com.rivalpicks.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials.path:firebase-service-account.json}")
    private String firebaseCredentialsPath;

    @Value("${FIREBASE_CREDENTIALS:}")
    private String firebaseCredentialsJson;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount;

                // Try environment variable first (for production)
                if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isEmpty()) {
                    log.info("Initializing Firebase from environment variable");
                    serviceAccount = new ByteArrayInputStream(
                            firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8));
                } else {
                    // Fall back to file (for local development)
                    log.info("Initializing Firebase from file: {}", firebaseCredentialsPath);
                    ClassPathResource resource = new ClassPathResource(firebaseCredentialsPath);
                    serviceAccount = resource.getInputStream();
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase initialized successfully");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
            throw new RuntimeException("Failed to initialize Firebase", e);
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        return FirebaseMessaging.getInstance();
    }
}

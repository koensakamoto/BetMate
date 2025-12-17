package com.rivalpicks.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for serving Apple Universal Links and Android App Links configuration files.
 * These files allow the mobile app to handle deep links from email verification, password reset, etc.
 */
@RestController
public class AppLinksController {

    private static final String APPLE_TEAM_ID = "H977QD5KKX";
    private static final String BUNDLE_ID = "com.rivalpicks.app";
    private static final String ANDROID_PACKAGE = "com.rivalpicks.app";

    @Value("${app.android-sha256-fingerprint:}")
    private String androidSha256Fingerprint;

    /**
     * Apple App Site Association file for iOS Universal Links.
     * iOS fetches this file to verify the app is allowed to handle links from this domain.
     */
    @GetMapping(
        value = "/.well-known/apple-app-site-association",
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> getAppleAppSiteAssociation() {
        String json = """
            {
              "applinks": {
                "apps": [],
                "details": [
                  {
                    "appID": "%s.%s",
                    "paths": [
                      "/auth/*"
                    ]
                  }
                ]
              }
            }
            """.formatted(APPLE_TEAM_ID, BUNDLE_ID);

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(json);
    }

    /**
     * Android Asset Links file for Android App Links.
     * Android fetches this file to verify the app is allowed to handle links from this domain.
     */
    @GetMapping(
        value = "/.well-known/assetlinks.json",
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> getAssetLinks() {
        String json = """
            [
              {
                "relation": ["delegate_permission/common.handle_all_urls"],
                "target": {
                  "namespace": "android_app",
                  "package_name": "%s",
                  "sha256_cert_fingerprints": ["%s"]
                }
              }
            ]
            """.formatted(ANDROID_PACKAGE, androidSha256Fingerprint);

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(json);
    }
}

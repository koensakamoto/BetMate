package com.rivalpicks.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Fallback controller for group invite deep links.
 *
 * Handles invite links when:
 * - Universal/App Links don't trigger
 * - The app is NOT installed on the device
 * - The user is on a desktop browser
 *
 * It serves a smart redirect page that:
 * 1. Tries to open the app using the custom URL scheme (rivalpicks://invite/{groupId})
 * 2. Falls back to the App/Play Store if the app doesn't open
 */
@RestController
@RequestMapping("/invite")
public class InviteFallbackController {

    private static final String APP_STORE_URL = "https://apps.apple.com/app/rivalpicks/id6756641492";
    private static final String PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.rivalpicks.app";

    /**
     * Fallback for group invite deep link.
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<String> inviteFallback(
            @PathVariable Long groupId,
            HttpServletRequest request) {

        // Validate groupId is positive
        if (groupId == null || groupId <= 0) {
            return ResponseEntity.badRequest()
                .contentType(MediaType.TEXT_HTML)
                .body(buildErrorPage("Invalid invite link"));
        }

        // Build the custom scheme URL
        String appSchemeUrl = "rivalpicks://invite/" + groupId;

        // Determine which store to use based on user agent
        String userAgent = request.getHeader("User-Agent");
        String storeUrl = APP_STORE_URL; // Default to iOS
        if (userAgent != null && userAgent.toLowerCase().contains("android")) {
            storeUrl = PLAY_STORE_URL;
        }

        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .body(buildSmartRedirectPage(appSchemeUrl, storeUrl));
    }

    private String buildSmartRedirectPage(String appSchemeUrl, String storeUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Join Group on RivalPicks</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #0a0a0f;
                        color: #fff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        text-align: center;
                        padding: 20px;
                    }
                    .container { max-width: 400px; width: 100%%; }
                    .spinner {
                        width: 48px;
                        height: 48px;
                        border: 4px solid rgba(0, 212, 170, 0.2);
                        border-top-color: #00D4AA;
                        border-radius: 50%%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 24px;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    h1 {
                        color: #00D4AA;
                        font-size: 24px;
                        margin-bottom: 12px;
                    }
                    p {
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 16px;
                        margin-bottom: 24px;
                        line-height: 1.5;
                    }
                    .buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .btn {
                        display: inline-block;
                        background: #00D4AA;
                        color: #000;
                        padding: 16px 32px;
                        border-radius: 12px;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 16px;
                        transition: opacity 0.2s;
                    }
                    .btn:hover { opacity: 0.9; }
                    .btn-secondary {
                        background: rgba(255, 255, 255, 0.1);
                        color: #fff;
                    }
                    .hidden { display: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="spinner" id="spinner"></div>
                    <h1>Opening RivalPicks...</h1>
                    <p id="status">You've been invited to join a group!</p>
                    <div class="buttons hidden" id="buttons">
                        <a href="%s" class="btn">Open App</a>
                        <a href="%s" class="btn btn-secondary">Get the App</a>
                    </div>
                </div>
                <script>
                    (function() {
                        var appUrl = "%s";
                        var storeUrl = "%s";
                        var timeout;

                        // Try to open the app via custom scheme
                        window.location.href = appUrl;

                        // If page is still visible after 1.5 seconds, show buttons
                        timeout = setTimeout(function() {
                            document.getElementById('spinner').style.display = 'none';
                            document.getElementById('status').textContent = 'App not opening? Try the buttons below:';
                            document.getElementById('buttons').classList.remove('hidden');
                        }, 1500);

                        // If user leaves page (app opened), clear timeout
                        document.addEventListener('visibilitychange', function() {
                            if (document.hidden) {
                                clearTimeout(timeout);
                            }
                        });
                    })();
                </script>
            </body>
            </html>
            """.formatted(appSchemeUrl, storeUrl, appSchemeUrl, storeUrl);
    }

    private String buildErrorPage(String message) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invalid Link - RivalPicks</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #0a0a0f;
                        color: #fff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        text-align: center;
                        padding: 20px;
                    }
                    .container { max-width: 400px; width: 100%%; }
                    h1 {
                        color: #ff6b6b;
                        font-size: 24px;
                        margin-bottom: 12px;
                    }
                    p {
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 16px;
                        line-height: 1.5;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Invalid Link</h1>
                    <p>%s</p>
                </div>
            </body>
            </html>
            """.formatted(message);
    }
}

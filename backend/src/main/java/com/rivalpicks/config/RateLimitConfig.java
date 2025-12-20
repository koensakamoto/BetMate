package com.rivalpicks.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "rate-limiting")
public class RateLimitConfig {

    private boolean enabled = true;
    private RateLimitProperties login = new RateLimitProperties(5, 15);
    private RateLimitProperties register = new RateLimitProperties(3, 60);
    private RateLimitProperties forgotPassword = new RateLimitProperties(3, 60);
    private RateLimitProperties resetPassword = new RateLimitProperties(10, 15);
    private RateLimitProperties defaultLimit = new RateLimitProperties(100, 1);
    // File upload rate limit (10 uploads per hour)
    private RateLimitProperties fileUpload = new RateLimitProperties(10, 60);
    // WebSocket rate limits
    private RateLimitProperties websocketConnect = new RateLimitProperties(5, 1);
    private RateLimitProperties websocketMessage = new RateLimitProperties(30, 1);

    @Data
    public static class RateLimitProperties {
        private int requests;
        private int durationMinutes;

        public RateLimitProperties() {}

        public RateLimitProperties(int requests, int durationMinutes) {
            this.requests = requests;
            this.durationMinutes = durationMinutes;
        }
    }

    public RateLimitProperties getDefault() {
        return defaultLimit;
    }

    public void setDefault(RateLimitProperties defaultLimit) {
        this.defaultLimit = defaultLimit;
    }
}

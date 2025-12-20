package com.rivalpicks.service.security;

import com.rivalpicks.config.RateLimitConfig;
import com.rivalpicks.config.RateLimitConfig.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

@Slf4j
@Service
public class RateLimitingService {

    private final RateLimitConfig rateLimitConfig;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.timeout:2000ms}")
    private Duration redisTimeout;

    private RedisClient redisClient;
    private StatefulRedisConnection<String, byte[]> connection;
    private ProxyManager<String> proxyManager;

    public RateLimitingService(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }

    @PostConstruct
    public void init() {
        if (!rateLimitConfig.isEnabled()) {
            log.info("Rate limiting is disabled");
            return;
        }

        try {
            RedisURI.Builder uriBuilder = RedisURI.builder()
                    .withHost(redisHost)
                    .withPort(redisPort)
                    .withTimeout(redisTimeout);

            // Add password if configured
            if (redisPassword != null && !redisPassword.isEmpty()) {
                uriBuilder.withPassword(redisPassword.toCharArray());
            }

            RedisURI redisUri = uriBuilder.build();
            redisClient = RedisClient.create(redisUri);
            connection = redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
            proxyManager = LettuceBasedProxyManager.builderFor(connection)
                    .withExpirationStrategy(ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofHours(1)))
                    .build();
            log.info("Rate limiting service initialized with Redis at {}:{}", redisHost, redisPort);
        } catch (Exception e) {
            log.error("Failed to initialize rate limiting with Redis at {}:{}, falling back to disabled",
                    redisHost, redisPort, e);
            rateLimitConfig.setEnabled(false);
        }
    }

    @PreDestroy
    public void cleanup() {
        if (connection != null) {
            connection.close();
        }
        if (redisClient != null) {
            redisClient.shutdown();
        }
    }

    public enum RateLimitType {
        LOGIN,
        REGISTER,
        FORGOT_PASSWORD,
        RESET_PASSWORD,
        DEFAULT,
        FILE_UPLOAD,
        // WebSocket rate limit types
        WEBSOCKET_CONNECT,
        WEBSOCKET_MESSAGE
    }

    public RateLimitResult tryConsume(String key, RateLimitType type) {
        if (!rateLimitConfig.isEnabled() || proxyManager == null) {
            return RateLimitResult.allowed(Long.MAX_VALUE);
        }

        String bucketKey = "rate_limit:" + type.name().toLowerCase() + ":" + key;
        RateLimitProperties props = getPropertiesForType(type);

        Supplier<BucketConfiguration> configSupplier = () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(props.getRequests())
                        .refillGreedy(props.getRequests(), Duration.ofMinutes(props.getDurationMinutes()))
                        .build())
                .build();

        Bucket bucket = proxyManager.builder().build(bucketKey, configSupplier);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            log.debug("Rate limit check passed for key: {}, remaining: {}", bucketKey, probe.getRemainingTokens());
            return RateLimitResult.allowed(probe.getRemainingTokens());
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
            log.warn("Rate limit exceeded for key: {}, retry after: {} seconds", bucketKey, waitSeconds);
            return RateLimitResult.blocked(waitSeconds);
        }
    }

    private RateLimitProperties getPropertiesForType(RateLimitType type) {
        return switch (type) {
            case LOGIN -> rateLimitConfig.getLogin();
            case REGISTER -> rateLimitConfig.getRegister();
            case FORGOT_PASSWORD -> rateLimitConfig.getForgotPassword();
            case RESET_PASSWORD -> rateLimitConfig.getResetPassword();
            case DEFAULT -> rateLimitConfig.getDefault();
            case FILE_UPLOAD -> rateLimitConfig.getFileUpload();
            case WEBSOCKET_CONNECT -> rateLimitConfig.getWebsocketConnect();
            case WEBSOCKET_MESSAGE -> rateLimitConfig.getWebsocketMessage();
        };
    }

    public record RateLimitResult(boolean allowed, long remainingTokens, long retryAfterSeconds) {
        public static RateLimitResult allowed(long remainingTokens) {
            return new RateLimitResult(true, remainingTokens, 0);
        }

        public static RateLimitResult blocked(long retryAfterSeconds) {
            return new RateLimitResult(false, 0, retryAfterSeconds);
        }
    }
}

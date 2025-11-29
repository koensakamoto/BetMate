package com.rivalpicks.service.security;

import com.rivalpicks.config.RateLimitConfig;
import com.rivalpicks.config.RateLimitConfig.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitingService {

    private final RateLimitConfig rateLimitConfig;

    private RedisClient redisClient;
    private StatefulRedisConnection<String, byte[]> connection;
    private ProxyManager<String> proxyManager;

    @PostConstruct
    public void init() {
        if (!rateLimitConfig.isEnabled()) {
            log.info("Rate limiting is disabled");
            return;
        }

        try {
            redisClient = RedisClient.create("redis://localhost:6379");
            connection = redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
            proxyManager = LettuceBasedProxyManager.builderFor(connection)
                    .build();
            log.info("Rate limiting service initialized with Redis backend");
        } catch (Exception e) {
            log.error("Failed to initialize rate limiting with Redis, falling back to disabled", e);
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
        DEFAULT
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
            case DEFAULT -> rateLimitConfig.getDefault();
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

package com.rivalpicks.service.presence;

import com.rivalpicks.dto.presence.PresenceInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Service for managing user presence state using Redis.
 * Provides real-time tracking of whether users are online, in background, or offline.
 */
@Service
public class PresenceService {

    private static final Logger logger = LoggerFactory.getLogger(PresenceService.class);

    private static final String PRESENCE_KEY_PREFIX = "presence:";
    private static final long PRESENCE_TTL_SECONDS = 45; // Auto-expire if no heartbeat

    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public PresenceService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Updates the presence state for a user.
     *
     * @param userId the user's ID
     * @param state  the app state ("active", "background", or "inactive")
     * @param screen the current screen name (optional)
     * @param chatId the group ID if viewing a chat (optional)
     */
    public void updatePresence(Long userId, String state, String screen, Long chatId) {
        String key = getPresenceKey(userId);

        // Treat "inactive" as going offline - just remove the key
        if ("inactive".equals(state)) {
            redisTemplate.delete(key);
            logger.debug("User {} marked as inactive, removed presence", userId);
            return;
        }

        PresenceInfo presence = new PresenceInfo(
                state,
                screen,
                chatId,
                System.currentTimeMillis()
        );

        redisTemplate.opsForValue().set(key, presence, PRESENCE_TTL_SECONDS, TimeUnit.SECONDS);
        logger.debug("Updated presence for user {}: {}", userId, presence);
    }

    /**
     * Gets the current presence info for a user.
     *
     * @param userId the user's ID
     * @return the presence info, or null if user has no presence entry (offline)
     */
    public PresenceInfo getPresence(Long userId) {
        String key = getPresenceKey(userId);
        Object value = redisTemplate.opsForValue().get(key);

        logger.info("Getting presence for user {}, key={}, value={}", userId, key, value);

        if (value == null) {
            logger.info("No presence found for user {} (offline)", userId);
            return null;
        }

        // Handle deserialization
        if (value instanceof PresenceInfo) {
            PresenceInfo presence = (PresenceInfo) value;
            logger.info("Found presence for user {}: state={}, screen={}, chatId={}",
                       userId, presence.getState(), presence.getScreen(), presence.getChatId());
            return presence;
        }

        // Try to handle Map deserialization (common Redis issue)
        if (value instanceof java.util.Map) {
            try {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> map = (java.util.Map<String, Object>) value;
                String state = (String) map.get("state");
                String screen = (String) map.get("screen");
                Long chatId = map.get("chatId") != null ? ((Number) map.get("chatId")).longValue() : null;
                Long lastSeen = map.get("lastSeen") != null ? ((Number) map.get("lastSeen")).longValue() : System.currentTimeMillis();

                PresenceInfo presence = new PresenceInfo(state, screen, chatId, lastSeen);
                logger.info("Converted Map to PresenceInfo for user {}: state={}, screen={}, chatId={}",
                           userId, state, screen, chatId);
                return presence;
            } catch (Exception e) {
                logger.error("Failed to convert Map to PresenceInfo for user {}: {}", userId, e.getMessage());
            }
        }

        logger.warn("Unexpected presence value type for user {}: {}", userId, value.getClass());
        return null;
    }

    /**
     * Checks if a user is currently active (app in foreground).
     *
     * @param userId the user's ID
     * @return true if user is active
     */
    public boolean isActive(Long userId) {
        PresenceInfo presence = getPresence(userId);
        return presence != null && presence.isActive();
    }

    /**
     * Checks if a user is currently viewing a specific chat.
     *
     * @param userId  the user's ID
     * @param groupId the group/chat ID
     * @return true if user is actively viewing that chat
     */
    public boolean isViewingChat(Long userId, Long groupId) {
        PresenceInfo presence = getPresence(userId);
        return presence != null && presence.isViewingChat(groupId);
    }

    /**
     * Removes the presence entry for a user (marks them as offline).
     *
     * @param userId the user's ID
     */
    public void removePresence(Long userId) {
        String key = getPresenceKey(userId);
        redisTemplate.delete(key);
        logger.debug("Removed presence for user {}", userId);
    }

    /**
     * Refreshes the TTL for a user's presence (called by heartbeat).
     *
     * @param userId the user's ID
     * @return true if presence was refreshed, false if no existing presence
     */
    public boolean refreshPresenceTtl(Long userId) {
        String key = getPresenceKey(userId);
        Boolean result = redisTemplate.expire(key, PRESENCE_TTL_SECONDS, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }

    /**
     * Gets the Redis key for a user's presence.
     */
    private String getPresenceKey(Long userId) {
        return PRESENCE_KEY_PREFIX + userId;
    }
}

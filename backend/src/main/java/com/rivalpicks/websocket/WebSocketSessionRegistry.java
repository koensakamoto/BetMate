package com.rivalpicks.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for tracking connected WebSocket users.
 * Thread-safe implementation using ConcurrentHashMap.
 */
@Component
public class WebSocketSessionRegistry {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketSessionRegistry.class);

    // Maps username to their session IDs (a user could have multiple sessions/devices)
    private final ConcurrentHashMap<String, Set<String>> userSessions = new ConcurrentHashMap<>();

    /**
     * Registers a user session when they connect via WebSocket.
     *
     * @param username the username of the connected user
     * @param sessionId the WebSocket session ID
     */
    public void userConnected(String username, String sessionId) {
        userSessions.computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet())
                .add(sessionId);
        logger.debug("User {} connected with session {}, total sessions: {}",
                username, sessionId, userSessions.get(username).size());
    }

    /**
     * Unregisters a user session when they disconnect.
     *
     * @param username the username of the disconnected user
     * @param sessionId the WebSocket session ID
     */
    public void userDisconnected(String username, String sessionId) {
        Set<String> sessions = userSessions.get(username);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(username);
                logger.debug("User {} fully disconnected (no remaining sessions)", username);
            } else {
                logger.debug("User {} disconnected session {}, remaining sessions: {}",
                        username, sessionId, sessions.size());
            }
        }
    }

    /**
     * Checks if a user is currently online (has at least one active WebSocket session).
     *
     * @param username the username to check
     * @return true if the user has an active WebSocket connection
     */
    public boolean isOnline(String username) {
        Set<String> sessions = userSessions.get(username);
        return sessions != null && !sessions.isEmpty();
    }

    /**
     * Gets the number of active sessions for a user.
     *
     * @param username the username to check
     * @return the number of active sessions
     */
    public int getSessionCount(String username) {
        Set<String> sessions = userSessions.get(username);
        return sessions != null ? sessions.size() : 0;
    }

    /**
     * Gets the total number of online users.
     *
     * @return the count of online users
     */
    public int getOnlineUserCount() {
        return userSessions.size();
    }

    /**
     * Gets all online usernames.
     *
     * @return set of online usernames
     */
    public Set<String> getOnlineUsers() {
        return Set.copyOf(userSessions.keySet());
    }
}

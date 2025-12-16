package com.rivalpicks.dto.presence;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO representing a user's presence information stored in Redis.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PresenceInfo {

    private String state;      // "active" or "background"
    private String screen;     // "chat", "home", "notifications", etc.
    private Long chatId;       // Group ID if viewing a chat
    private Long lastSeen;     // Unix timestamp in milliseconds

    public PresenceInfo() {
    }

    public PresenceInfo(String state, String screen, Long chatId, Long lastSeen) {
        this.state = state;
        this.screen = screen;
        this.chatId = chatId;
        this.lastSeen = lastSeen;
    }

    /**
     * Checks if the user is currently active (app in foreground).
     */
    public boolean isActive() {
        return "active".equals(state);
    }

    /**
     * Checks if the user is viewing a specific chat.
     */
    public boolean isViewingChat(Long groupId) {
        return isActive() && "chat".equals(screen) && groupId != null && groupId.equals(chatId);
    }

    // Getters and setters

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getScreen() {
        return screen;
    }

    public void setScreen(String screen) {
        this.screen = screen;
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public Long getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(Long lastSeen) {
        this.lastSeen = lastSeen;
    }

    @Override
    public String toString() {
        return "PresenceInfo{" +
                "state='" + state + '\'' +
                ", screen='" + screen + '\'' +
                ", chatId=" + chatId +
                ", lastSeen=" + lastSeen +
                '}';
    }
}

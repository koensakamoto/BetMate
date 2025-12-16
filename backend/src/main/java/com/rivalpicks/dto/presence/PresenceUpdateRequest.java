package com.rivalpicks.dto.presence;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for updating user presence state.
 */
public class PresenceUpdateRequest {

    @NotBlank(message = "State is required")
    @Pattern(regexp = "^(active|background|inactive)$", message = "State must be 'active', 'background', or 'inactive'")
    private String state;

    private String screen;  // Optional: current screen name
    private Long chatId;    // Optional: group ID if viewing a chat

    public PresenceUpdateRequest() {
    }

    public PresenceUpdateRequest(String state, String screen, Long chatId) {
        this.state = state;
        this.screen = screen;
        this.chatId = chatId;
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
}

package com.circlebet.dto.store.response;

/**
 * Response DTO for user's equipped loadout.
 * Contains only the currently equipped cosmetic items.
 */
public class UserLoadoutResponseDto {
    
    private EquippedItemResponseDto equippedTitle;
    private EquippedItemResponseDto equippedAvatar;
    private EquippedItemResponseDto equippedBadge;
    private EquippedItemResponseDto equippedTheme;
    private EquippedItemResponseDto equippedFrame;

    // Default constructor
    public UserLoadoutResponseDto() {}

    // Getters and setters
    public EquippedItemResponseDto getEquippedTitle() {
        return equippedTitle;
    }

    public void setEquippedTitle(EquippedItemResponseDto equippedTitle) {
        this.equippedTitle = equippedTitle;
    }

    public EquippedItemResponseDto getEquippedAvatar() {
        return equippedAvatar;
    }

    public void setEquippedAvatar(EquippedItemResponseDto equippedAvatar) {
        this.equippedAvatar = equippedAvatar;
    }

    public EquippedItemResponseDto getEquippedBadge() {
        return equippedBadge;
    }

    public void setEquippedBadge(EquippedItemResponseDto equippedBadge) {
        this.equippedBadge = equippedBadge;
    }

    public EquippedItemResponseDto getEquippedTheme() {
        return equippedTheme;
    }

    public void setEquippedTheme(EquippedItemResponseDto equippedTheme) {
        this.equippedTheme = equippedTheme;
    }

    public EquippedItemResponseDto getEquippedFrame() {
        return equippedFrame;
    }

    public void setEquippedFrame(EquippedItemResponseDto equippedFrame) {
        this.equippedFrame = equippedFrame;
    }
}
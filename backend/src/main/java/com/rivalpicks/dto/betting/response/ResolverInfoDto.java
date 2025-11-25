package com.rivalpicks.dto.betting.response;

import com.rivalpicks.entity.betting.BetResolver;
import com.rivalpicks.entity.user.User;

/**
 * DTO for resolver information in bet responses.
 */
public class ResolverInfoDto {
    private Long id;
    private String username;
    private String displayName;
    private String profileImageUrl;
    private Boolean hasVoted;

    public static ResolverInfoDto fromUser(User user) {
        ResolverInfoDto dto = new ResolverInfoDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.displayName = user.getFullName();
        dto.profileImageUrl = user.getProfileImageUrl();
        return dto;
    }

    public static ResolverInfoDto fromBetResolver(BetResolver resolver) {
        ResolverInfoDto dto = new ResolverInfoDto();
        User user = resolver.getResolver();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.displayName = user.getFullName();
        dto.profileImageUrl = user.getProfileImageUrl();
        return dto;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public Boolean getHasVoted() {
        return hasVoted;
    }

    public void setHasVoted(Boolean hasVoted) {
        this.hasVoted = hasVoted;
    }
}

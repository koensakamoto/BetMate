package com.rivalpicks.dto.betting.response;

import com.rivalpicks.entity.betting.BetResolver;
import com.rivalpicks.entity.user.User;

import java.util.List;

/**
 * DTO for resolver information in bet responses.
 */
public class ResolverInfoDto {
    private Long id;
    private String username;
    private String displayName;
    private String profileImageUrl;
    private Boolean hasVoted;

    // Vote details - what the resolver voted for
    private String votedOutcome;           // For MCQ bets: the option text they voted for
    private List<Long> votedWinnerUserIds; // For prediction bets: user IDs of winners they selected
    private String reasoning;              // Optional reasoning/comment for their vote

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

    public String getVotedOutcome() {
        return votedOutcome;
    }

    public void setVotedOutcome(String votedOutcome) {
        this.votedOutcome = votedOutcome;
    }

    public List<Long> getVotedWinnerUserIds() {
        return votedWinnerUserIds;
    }

    public void setVotedWinnerUserIds(List<Long> votedWinnerUserIds) {
        this.votedWinnerUserIds = votedWinnerUserIds;
    }

    public String getReasoning() {
        return reasoning;
    }

    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
}

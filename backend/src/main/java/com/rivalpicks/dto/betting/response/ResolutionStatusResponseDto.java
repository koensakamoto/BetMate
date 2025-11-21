package com.rivalpicks.dto.betting.response;

import java.util.Map;

/**
 * DTO for resolution status and voting progress response.
 */
public class ResolutionStatusResponseDto {

    private Long betId;
    private String betType;
    private String resolutionMethod;
    private String status;

    // For both prediction and multiple choice
    private Integer totalResolvers;
    private Integer resolversWhoVoted;

    // For prediction bets
    private Integer totalParticipations;

    // For multiple choice consensus voting
    private Map<String, Long> voteCounts;

    // Getters and setters
    public Long getBetId() {
        return betId;
    }

    public void setBetId(Long betId) {
        this.betId = betId;
    }

    public String getBetType() {
        return betType;
    }

    public void setBetType(String betType) {
        this.betType = betType;
    }

    public String getResolutionMethod() {
        return resolutionMethod;
    }

    public void setResolutionMethod(String resolutionMethod) {
        this.resolutionMethod = resolutionMethod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getTotalResolvers() {
        return totalResolvers;
    }

    public void setTotalResolvers(Integer totalResolvers) {
        this.totalResolvers = totalResolvers;
    }

    public Integer getResolversWhoVoted() {
        return resolversWhoVoted;
    }

    public void setResolversWhoVoted(Integer resolversWhoVoted) {
        this.resolversWhoVoted = resolversWhoVoted;
    }

    public Integer getTotalParticipations() {
        return totalParticipations;
    }

    public void setTotalParticipations(Integer totalParticipations) {
        this.totalParticipations = totalParticipations;
    }

    public Map<String, Long> getVoteCounts() {
        return voteCounts;
    }

    public void setVoteCounts(Map<String, Long> voteCounts) {
        this.voteCounts = voteCounts;
    }
}

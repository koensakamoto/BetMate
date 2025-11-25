package com.rivalpicks.dto.betting.response;

import java.util.Map;

/**
 * DTO for voting progress information in PARTICIPANT_VOTE bets.
 */
public class VotingProgressDto {
    private Integer totalResolvers;
    private Integer votesSubmitted;
    private Map<String, Long> voteDistribution;

    // Getters and setters
    public Integer getTotalResolvers() {
        return totalResolvers;
    }

    public void setTotalResolvers(Integer totalResolvers) {
        this.totalResolvers = totalResolvers;
    }

    public Integer getVotesSubmitted() {
        return votesSubmitted;
    }

    public void setVotesSubmitted(Integer votesSubmitted) {
        this.votesSubmitted = votesSubmitted;
    }

    public Map<String, Long> getVoteDistribution() {
        return voteDistribution;
    }

    public void setVoteDistribution(Map<String, Long> voteDistribution) {
        this.voteDistribution = voteDistribution;
    }
}

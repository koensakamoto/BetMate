package com.betmate.event.betting;

import com.betmate.entity.betting.Bet;
import com.betmate.event.base.DomainEvent;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class BetResolvedEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long groupId;
    private final String groupName;
    private final List<Long> winnerIds;
    private final List<Long> loserIds;
    private final Map<Long, BigDecimal> payouts;
    private final String resolution;

    public BetResolvedEvent(Long betId, String betTitle, Long groupId, String groupName,
                           List<Long> winnerIds, List<Long> loserIds,
                           Map<Long, BigDecimal> payouts, String resolution) {
        super("BET_RESOLVED");
        this.betId = betId;
        this.betTitle = betTitle;
        this.groupId = groupId;
        this.groupName = groupName;
        this.winnerIds = winnerIds;
        this.loserIds = loserIds;
        this.payouts = payouts;
        this.resolution = resolution;
    }

    public Long getBetId() {
        return betId;
    }

    public String getBetTitle() {
        return betTitle;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public List<Long> getWinnerIds() {
        return winnerIds;
    }

    public List<Long> getLoserIds() {
        return loserIds;
    }

    public Map<Long, BigDecimal> getPayouts() {
        return payouts;
    }

    public String getResolution() {
        return resolution;
    }

    public boolean isWinner(Long userId) {
        return winnerIds.contains(userId);
    }

    public BigDecimal getPayoutForUser(Long userId) {
        return payouts.getOrDefault(userId, BigDecimal.ZERO);
    }
}
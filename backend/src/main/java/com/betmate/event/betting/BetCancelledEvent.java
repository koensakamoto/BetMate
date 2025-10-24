package com.betmate.event.betting;

import com.betmate.event.base.DomainEvent;

import java.math.BigDecimal;
import java.util.Map;

public class BetCancelledEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long groupId;
    private final String groupName;
    private final Long cancelledById;
    private final String cancelledByName;
    private final String reason;
    private final Map<Long, BigDecimal> refunds;

    public BetCancelledEvent(Long betId, String betTitle, Long groupId, String groupName,
                            Long cancelledById, String cancelledByName, String reason,
                            Map<Long, BigDecimal> refunds) {
        super("BET_CANCELLED");
        this.betId = betId;
        this.betTitle = betTitle;
        this.groupId = groupId;
        this.groupName = groupName;
        this.cancelledById = cancelledById;
        this.cancelledByName = cancelledByName;
        this.reason = reason;
        this.refunds = refunds;
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

    public Long getCancelledById() {
        return cancelledById;
    }

    public String getCancelledByName() {
        return cancelledByName;
    }

    public String getReason() {
        return reason;
    }

    public Map<Long, BigDecimal> getRefunds() {
        return refunds;
    }

    public BigDecimal getRefundForUser(Long userId) {
        return refunds.getOrDefault(userId, BigDecimal.ZERO);
    }
}
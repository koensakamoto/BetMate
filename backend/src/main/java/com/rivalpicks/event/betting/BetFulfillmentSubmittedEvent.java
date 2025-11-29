package com.rivalpicks.event.betting;

import com.rivalpicks.event.base.DomainEvent;

/**
 * Event published when a user submits fulfillment proof for a bet.
 * Used to notify other bet participants about the submission.
 */
public class BetFulfillmentSubmittedEvent extends DomainEvent {
    private final Long betId;
    private final String betTitle;
    private final Long submitterId;
    private final String submitterUsername;
    private final Long groupId;
    private final String groupName;

    public BetFulfillmentSubmittedEvent(Long betId, String betTitle, Long submitterId,
                                        String submitterUsername, Long groupId, String groupName) {
        super("BET_FULFILLMENT_SUBMITTED");
        this.betId = betId;
        this.betTitle = betTitle;
        this.submitterId = submitterId;
        this.submitterUsername = submitterUsername;
        this.groupId = groupId;
        this.groupName = groupName;
    }

    public Long getBetId() {
        return betId;
    }

    public String getBetTitle() {
        return betTitle;
    }

    public Long getSubmitterId() {
        return submitterId;
    }

    public String getSubmitterUsername() {
        return submitterUsername;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }
}

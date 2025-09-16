package com.circlebet.event.social;

import com.circlebet.event.base.DomainEvent;

public class FriendRequestEvent extends DomainEvent {
    private final Long requesterId;
    private final String requesterName;
    private final String requesterUsername;
    private final Long targetUserId;
    private final String targetUsername;

    public FriendRequestEvent(Long requesterId, String requesterName, String requesterUsername,
                             Long targetUserId, String targetUsername) {
        super("FRIEND_REQUEST");
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.requesterUsername = requesterUsername;
        this.targetUserId = targetUserId;
        this.targetUsername = targetUsername;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public String getRequesterUsername() {
        return requesterUsername;
    }

    public Long getTargetUserId() {
        return targetUserId;
    }

    public String getTargetUsername() {
        return targetUsername;
    }
}
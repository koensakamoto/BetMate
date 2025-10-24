package com.betmate.event.social;

import com.betmate.event.base.DomainEvent;

public class FriendRequestAcceptedEvent extends DomainEvent {
    private final Long requesterId;
    private final String requesterName;
    private final Long accepterId;
    private final String accepterName;
    private final String accepterUsername;

    public FriendRequestAcceptedEvent(Long requesterId, String requesterName,
                                     Long accepterId, String accepterName, String accepterUsername) {
        super("FRIEND_REQUEST_ACCEPTED");
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.accepterId = accepterId;
        this.accepterName = accepterName;
        this.accepterUsername = accepterUsername;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public Long getAccepterId() {
        return accepterId;
    }

    public String getAccepterName() {
        return accepterName;
    }

    public String getAccepterUsername() {
        return accepterUsername;
    }
}
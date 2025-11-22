package com.rivalpicks.event.group;

import com.rivalpicks.event.base.DomainEvent;

import java.util.List;

public class GroupDeletedEvent extends DomainEvent {
    private final Long groupId;
    private final String groupName;
    private final Long deletedById;
    private final String deletedByName;
    private final List<Long> memberIds;

    public GroupDeletedEvent(Long groupId, String groupName,
                            Long deletedById, String deletedByName,
                            List<Long> memberIds) {
        super("GROUP_DELETED");
        this.groupId = groupId;
        this.groupName = groupName;
        this.deletedById = deletedById;
        this.deletedByName = deletedByName;
        this.memberIds = memberIds;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getDeletedById() {
        return deletedById;
    }

    public String getDeletedByName() {
        return deletedByName;
    }

    public List<Long> getMemberIds() {
        return memberIds;
    }
}

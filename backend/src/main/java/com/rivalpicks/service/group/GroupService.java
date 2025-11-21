package com.rivalpicks.service.group;

import com.rivalpicks.dto.group.request.GroupUpdateRequestDto;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.group.GroupMembership;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.group.GroupNotFoundException;
import com.rivalpicks.repository.group.GroupRepository;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Core group management service handling CRUD operations and basic group data.
 * Does NOT handle membership operations, permissions, or security.
 */
@Service
@Validated
@Transactional(readOnly = true)
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;

    @Autowired
    public GroupService(GroupRepository groupRepository, GroupMembershipRepository membershipRepository) {
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
    }

    /**
     * Retrieves a group by ID.
     */
    public Group getGroupById(@NotNull Long groupId) {
        return groupRepository.findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new GroupNotFoundException("Group not found: " + groupId));
    }

    /**
     * Retrieves a group by name (case-insensitive).
     */
    public Optional<Group> getGroupByName(@NotNull String groupName) {
        return groupRepository.findByGroupNameIgnoreCaseAndDeletedAtIsNull(groupName);
    }

    /**
     * Searches groups by name or description.
     */
    public List<Group> searchGroups(@NotNull String searchTerm) {
        if (searchTerm.trim().isEmpty()) {
            return List.of();
        }
        return groupRepository.searchGroups(searchTerm.trim());
    }

    /**
     * Retrieves all active groups.
     */
    public List<Group> getActiveGroups() {
        return groupRepository.findByIsActiveTrueAndDeletedAtIsNull();
    }

    /**
     * Retrieves all public groups for discovery.
     */
    public List<Group> getPublicGroups() {
        return groupRepository.findPublicGroups();
    }

    /**
     * Retrieves groups created by a specific user.
     */
    public List<Group> getGroupsByCreator(@NotNull User creator) {
        return groupRepository.findByCreator(creator);
    }

    /**
     * Retrieves most active groups by message count.
     */
    public List<Group> getMostActiveGroups() {
        return groupRepository.findMostActiveGroups();
    }

    /**
     * Updates group information.
     */
    @Transactional
    public Group updateGroup(@NotNull Group group, @NotNull GroupUpdateRequestDto request) {
        if (request.getGroupName() != null && !request.getGroupName().equals(group.getGroupName())) {
            if (request.getGroupName().trim().isEmpty()) {
                throw new IllegalArgumentException("Group name cannot be empty");
            }
            if (!isGroupNameAvailable(request.getGroupName())) {
                throw new IllegalArgumentException("Group name already taken: " + request.getGroupName());
            }
            group.setGroupName(request.getGroupName().trim());
        }
        
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription().trim());
        }
        
        if (request.getGroupPictureUrl() != null) {
            group.setGroupPictureUrl(request.getGroupPictureUrl());
        }
        
        if (request.getPrivacy() != null) {
            group.setPrivacy(request.getPrivacy());
        }

        return groupRepository.save(group);
    }

    /**
     * Soft deletes a group by setting deletedAt timestamp and deactivating all memberships.
     */
    @Transactional
    public void deleteGroup(@NotNull Group group) {
        LocalDateTime now = LocalDateTime.now();

        // Mark group as deleted
        group.setDeletedAt(now);
        groupRepository.save(group);

        // Deactivate all memberships for this group
        List<GroupMembership> memberships = membershipRepository.findByGroup(group);
        for (GroupMembership membership : memberships) {
            membership.setIsActive(false);
            membership.setLeftAt(now);
        }
        membershipRepository.saveAll(memberships);
    }

    /**
     * Updates group picture URL.
     */
    @Transactional
    public Group updateGroupPicture(@NotNull Long groupId, @NotNull String pictureUrl) {
        Group group = getGroupById(groupId);
        group.setGroupPictureUrl(pictureUrl);
        return groupRepository.save(group);
    }

    /**
     * Saves a group (used by creation service).
     */
    @Transactional
    public Group saveGroup(@NotNull Group group) {
        return groupRepository.save(group);
    }

    /**
     * Updates group chat metadata (called when messages are sent).
     */
    @Transactional
    public void updateChatMetadata(@NotNull Long groupId, @NotNull User lastMessageUser) {
        LocalDateTime now = LocalDateTime.now();
        int updated = groupRepository.updateChatMetadata(groupId, now, lastMessageUser);
        if (updated == 0) {
            throw new GroupNotFoundException("Group not found or deleted: " + groupId);
        }
    }

    /**
     * Updates member count (called by membership service).
     */
    @Transactional
    public void updateMemberCount(@NotNull Long groupId, int newCount) {
        if (newCount < 0) {
            throw new IllegalArgumentException("Member count cannot be negative: " + newCount);
        }
        int updated = groupRepository.updateMemberCount(groupId, newCount);
        if (updated == 0) {
            throw new GroupNotFoundException("Group not found or deleted: " + groupId);
        }
    }

    /**
     * Checks if group name is available.
     */
    public boolean isGroupNameAvailable(@NotNull String groupName) {
        return !groupRepository.existsByGroupNameIgnoreCase(groupName);
    }

    /**
     * Checks if group has available slots for new members.
     * Uses the Group entity's own logic which considers both max members and current count.
     */
    public boolean hasAvailableSlots(@NotNull Long groupId) {
        Group group = getGroupById(groupId);
        return group.canAcceptNewMembers();
    }

    /**
     * Deactivates a group (soft delete).
     */
    @Transactional
    public void deactivateGroup(@NotNull Long groupId) {
        Group group = getGroupById(groupId);
        group.setIsActive(false);
        group.setDeletedAt(LocalDateTime.now());
        groupRepository.save(group);
    }

    /**
     * Reactivates a previously deactivated group.
     */
    @Transactional
    public void reactivateGroup(@NotNull Long groupId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new GroupNotFoundException("Group not found: " + groupId));
        group.setIsActive(true);
        group.setDeletedAt(null);
        groupRepository.save(group);
    }

    /**
     * Gets group statistics.
     */
    public GroupStats getGroupStats(@NotNull Long groupId) {
        Group group = getGroupById(groupId);
        return new GroupStats(
            group.getMemberCount(),
            group.getTotalMessages(),
            group.getLastMessageAt(),
            group.getCreatedAt(),
            group.getPrivacy()
        );
    }

    /**
     * Gets total count of active groups.
     */
    public Long getActiveGroupCount() {
        return groupRepository.countActiveGroups();
    }


    // DTO for group statistics
    public record GroupStats(
        int memberCount,
        Long totalMessages,
        LocalDateTime lastMessageAt,
        LocalDateTime createdAt,
        Group.Privacy privacy
    ) {}

}
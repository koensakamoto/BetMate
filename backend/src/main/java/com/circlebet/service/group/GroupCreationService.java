package com.circlebet.service.group;

import com.circlebet.dto.group.request.GroupCreationRequestDto;
import com.circlebet.entity.group.Group;
import com.circlebet.entity.user.User;
import com.circlebet.exception.group.GroupCreationException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

/**
 * Service dedicated to group creation and initial setup.
 * Handles validation, uniqueness checks, and group initialization.
 */
@Service
@Validated
@Transactional
public class GroupCreationService {

    public static final int DEFAULT_MAX_MEMBERS = 50;

    private final GroupService groupService;
    private final GroupMembershipService groupMembershipService;

    @Autowired
    public GroupCreationService(GroupService groupService, GroupMembershipService groupMembershipService) {
        this.groupService = groupService;
        this.groupMembershipService = groupMembershipService;
    }

    /**
     * Creates a new group with the creator as admin.
     */
    public Group createGroup(@NotNull User creator, @Valid GroupCreationRequestDto request) {
        validateGroupCreationRequest(request);
        
        Group group = createGroupFromRequest(creator, request);
        Group savedGroup = groupService.saveGroup(group);
        
        // Add creator as admin member
        groupMembershipService.addCreatorMembership(savedGroup, creator);
        
        return savedGroup;
    }

    /**
     * Checks if group name is available.
     */
    public boolean isGroupNameAvailable(@NotBlank String groupName) {
        return groupService.getGroupByName(groupName).isEmpty();
    }

    /**
     * Validates group creation request.
     */
    public GroupCreationValidation validateGroupCreation(@NotBlank String groupName) {
        boolean nameAvailable = isGroupNameAvailable(groupName);
        return new GroupCreationValidation(nameAvailable);
    }

    private void validateGroupCreationRequest(GroupCreationRequestDto request) {
        if (!isGroupNameAvailable(request.getGroupName())) {
            throw new GroupCreationException("Group name already exists: " + request.getGroupName());
        }
        
        if (request.getMaxMembers() != null && request.getMaxMembers() < 2) {
            throw new GroupCreationException("Maximum members must be at least 2");
        }
        
        if (request.getMaxMembers() != null && request.getMaxMembers() > 1000) {
            throw new GroupCreationException("Maximum members cannot exceed 1000");
        }
    }

    private Group createGroupFromRequest(User creator, GroupCreationRequestDto request) {
        Group group = new Group();
        group.setGroupName(request.getGroupName());
        group.setDescription(request.getDescription());
        group.setGroupPictureUrl(request.getGroupPictureUrl());
        group.setPrivacy(request.getPrivacy() != null ? request.getPrivacy() : Group.Privacy.PUBLIC);
        // Set max members with default
        Integer maxMembers = request.getMaxMembers();
        group.setMaxMembers(maxMembers != null ? maxMembers : DEFAULT_MAX_MEMBERS);
        group.setCreator(creator);
        
        // Set defaults
        group.setMemberCount(1); // Creator is first member
        group.setIsActive(true);
        group.setTotalMessages(0L);
        
        return group;
    }

    // Group creation validation result
    public record GroupCreationValidation(
        boolean nameAvailable
    ) {
        public boolean isValid() {
            return nameAvailable;
        }
    }

    public static class GroupCreationException extends RuntimeException {
        public GroupCreationException(String message) {
            super(message);
        }
    }
}
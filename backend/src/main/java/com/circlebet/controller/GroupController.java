package com.circlebet.controller;

import com.circlebet.dto.group.request.GroupCreationRequestDto;
import com.circlebet.dto.group.response.GroupResponseDto;
import com.circlebet.entity.group.Group;
import com.circlebet.entity.user.User;
import com.circlebet.service.group.GroupCreationService;
import com.circlebet.service.group.GroupService;
import com.circlebet.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for group management operations.
 * Handles group creation, membership, discovery, and administration.
 */
@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final GroupCreationService groupCreationService;
    private final UserService userService;

    @Autowired
    public GroupController(GroupService groupService,
                          GroupCreationService groupCreationService,
                          UserService userService) {
        this.groupService = groupService;
        this.groupCreationService = groupCreationService;
        this.userService = userService;
    }

    /**
     * Create a new group.
     */
    @PostMapping
    public ResponseEntity<GroupResponseDto> createGroup(
            @Valid @RequestBody GroupCreationRequestDto request,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group createdGroup = groupCreationService.createGroup(currentUser, request);
        GroupResponseDto response = convertToDetailedResponse(createdGroup, currentUser);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get group details by ID.
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponseDto> getGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);
        
        GroupResponseDto response = convertToDetailedResponse(group, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Check if group name is available.
     */
    @GetMapping("/check-name")
    public ResponseEntity<Boolean> checkGroupNameAvailability(
            @RequestParam String groupName) {
        
        boolean available = groupCreationService.isGroupNameAvailable(groupName);
        return ResponseEntity.ok(available);
    }

    // Helper methods for DTO conversion
    private GroupResponseDto convertToDetailedResponse(Group group, User currentUser) {
        GroupResponseDto response = new GroupResponseDto();
        response.setId(group.getId());
        response.setGroupName(group.getGroupName());
        response.setDescription(group.getDescription());
        response.setGroupPictureUrl(group.getGroupPictureUrl());
        response.setPrivacy(group.getPrivacy());
        response.setMemberCount(group.getMemberCount());
        response.setMaxMembers(group.getMaxMembers());
        response.setIsActive(group.getIsActive());
        response.setTotalMessages(group.getTotalMessages());
        response.setLastMessageAt(group.getLastMessageAt());
        response.setCreatedAt(group.getCreatedAt());
        response.setUpdatedAt(group.getUpdatedAt());
        
        // Set basic user context - we'll enhance this later when we have membership service methods
        response.setIsUserMember(false); // TODO: implement when membership service is complete
        response.setUserRole(null);
        
        return response;
    }
}
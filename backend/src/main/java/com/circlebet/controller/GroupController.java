package com.circlebet.controller;

import com.circlebet.dto.group.request.GroupCreationRequestDto;
import com.circlebet.dto.group.response.GroupResponseDto;
import com.circlebet.dto.group.response.GroupSummaryResponseDto;
import com.circlebet.dto.group.response.GroupMemberResponseDto;
import com.circlebet.entity.group.Group;
import com.circlebet.entity.group.GroupMembership;
import com.circlebet.entity.user.User;
import com.circlebet.service.group.GroupCreationService;
import com.circlebet.service.group.GroupMembershipService;
import com.circlebet.service.group.GroupService;
import com.circlebet.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for group management operations.
 * Handles group creation, membership, discovery, and administration.
 */
@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final GroupCreationService groupCreationService;
    private final GroupMembershipService groupMembershipService;
    private final UserService userService;

    @Autowired
    public GroupController(GroupService groupService,
                          GroupCreationService groupCreationService,
                          GroupMembershipService groupMembershipService,
                          UserService userService) {
        this.groupService = groupService;
        this.groupCreationService = groupCreationService;
        this.groupMembershipService = groupMembershipService;
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
     * Check if group name is available.
     */
    @GetMapping("/check-name")
    public ResponseEntity<Boolean> checkGroupNameAvailability(
            @RequestParam String groupName) {
        
        boolean available = groupCreationService.isGroupNameAvailable(groupName);
        return ResponseEntity.ok(available);
    }

    /**
     * Get public groups for discovery.
     * Excludes groups that the current user is already a member of.
     */
    @GetMapping("/public")
    public ResponseEntity<List<GroupSummaryResponseDto>> getPublicGroups(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        List<Group> allPublicGroups = groupService.getPublicGroups();
        List<Group> userGroups = groupMembershipService.getUserGroups(currentUser);
        
        // Filter out groups the user is already a member of
        List<Group> filteredGroups = allPublicGroups.stream()
            .filter(group -> userGroups.stream()
                .noneMatch(userGroup -> userGroup.getId().equals(group.getId())))
            .toList();
            
        List<GroupSummaryResponseDto> response = filteredGroups.stream()
            .map(group -> convertToSummaryResponse(group, currentUser))
            .toList();
        return ResponseEntity.ok(response);
    }

    /**
     * Get groups that the current user is a member of.
     */
    @GetMapping("/my-groups")
    public ResponseEntity<List<GroupSummaryResponseDto>> getMyGroups(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        List<Group> userGroups = groupMembershipService.getUserGroups(currentUser);
        List<GroupSummaryResponseDto> response = userGroups.stream()
            .map(group -> convertToSummaryResponse(group, currentUser))
            .toList();
            
        return ResponseEntity.ok(response);
    }

    /**
     * Search groups by name or description.
     */
    @GetMapping("/search")
    public ResponseEntity<List<GroupSummaryResponseDto>> searchGroups(
            @RequestParam String q, Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        List<Group> groups = groupService.searchGroups(q);
        List<GroupSummaryResponseDto> response = groups.stream()
            .map(group -> convertToSummaryResponse(group, currentUser))
            .toList();
        return ResponseEntity.ok(response);
    }

    /**
     * Get group members by group ID.
     */
    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberResponseDto>> getGroupMembers(
            @PathVariable Long groupId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);
        
        // Check if user is a member of the group (for security)
        if (!groupMembershipService.isMember(currentUser, group)) {
            throw new RuntimeException("Access denied - not a member of this group");
        }
        
        List<GroupMembership> memberships = groupMembershipService.getGroupMembers(group);
        List<GroupMemberResponseDto> response = memberships.stream()
            .map(this::convertToMemberResponse)
            .toList();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get group details by ID.
     * This endpoint must be LAST to avoid conflicts with specific endpoints.
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

    private GroupSummaryResponseDto convertToSummaryResponse(Group group, User currentUser) {
        GroupSummaryResponseDto response = new GroupSummaryResponseDto();
        response.setId(group.getId());
        response.setGroupName(group.getGroupName());
        response.setDescription(group.getDescription());
        response.setGroupPictureUrl(group.getGroupPictureUrl());
        response.setPrivacy(group.getPrivacy());
        response.setCreatorUsername(group.getCreator().getUsername());
        response.setMemberCount(group.getMemberCount());
        response.setMaxMembers(group.getMaxMembers());
        response.setIsActive(group.getIsActive());
        response.setTotalMessages(group.getTotalMessages());
        response.setLastMessageAt(group.getLastMessageAt());
        response.setCreatedAt(group.getCreatedAt());
        
        // Check if current user is a member of this group
        boolean isUserMember = groupMembershipService.isMember(currentUser, group);
        response.setIsUserMember(isUserMember);
        
        return response;
    }

    private GroupMemberResponseDto convertToMemberResponse(GroupMembership membership) {
        GroupMemberResponseDto response = new GroupMemberResponseDto();
        User user = membership.getUser();
        
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setDisplayName(user.getEffectiveDisplayName());
        response.setEmail(user.getEmail());
        response.setProfilePictureUrl(null); // User entity doesn't have profile picture yet
        response.setRole(membership.getRole());
        response.setIsActive(membership.getIsActive());
        response.setJoinedAt(membership.getJoinedAt());
        response.setLastActivityAt(membership.getLastActivityAt());
        response.setTotalBets(membership.getTotalBets());
        response.setTotalWins(membership.getTotalWins());
        response.setTotalLosses(membership.getTotalLosses());
        
        return response;
    }
}
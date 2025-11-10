package com.betmate.controller;

import com.betmate.dto.group.request.GroupCreationRequestDto;
import com.betmate.dto.group.request.GroupUpdateRequestDto;
import com.betmate.dto.group.request.UpdateMemberRoleRequestDto;
import com.betmate.dto.group.response.GroupResponseDto;
import com.betmate.dto.group.response.GroupSummaryResponseDto;
import com.betmate.dto.group.response.GroupMemberResponseDto;
import com.betmate.dto.group.response.MemberPreviewDto;
import com.betmate.dto.group.response.PendingRequestResponseDto;
import com.betmate.entity.group.Group;
import com.betmate.entity.group.GroupMembership;
import com.betmate.entity.user.User;
import com.betmate.service.group.GroupCreationService;
import com.betmate.service.group.GroupMembershipService;
import com.betmate.service.group.GroupService;
import com.betmate.service.user.UserService;
import com.betmate.service.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

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
    private final FileStorageService fileStorageService;

    @Autowired
    public GroupController(GroupService groupService,
                          GroupCreationService groupCreationService,
                          GroupMembershipService groupMembershipService,
                          UserService userService,
                          FileStorageService fileStorageService) {
        this.groupService = groupService;
        this.groupCreationService = groupCreationService;
        this.groupMembershipService = groupMembershipService;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
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
     * Update a member's role in the group.
     */
    @PutMapping("/{groupId}/members/{memberId}/role")
    public ResponseEntity<GroupMemberResponseDto> updateMemberRole(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateMemberRoleRequestDto request,
            Authentication authentication) {

        System.out.println("🔄 [DEBUG] Role update endpoint called - GroupId: " + groupId + ", MemberId: " + memberId + ", NewRole: " + request.getRole());

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);
        User targetUser = userService.getUserById(memberId);

        System.out.println("🔄 [DEBUG] Current user: " + currentUser.getUsername() + " (ID: " + currentUser.getId() + ")");
        System.out.println("🔄 [DEBUG] Target user: " + targetUser.getUsername() + " (ID: " + targetUser.getId() + ")");
        System.out.println("🔄 [DEBUG] Group: " + group.getGroupName() + " (ID: " + group.getId() + ")");

        // Update the member's role
        GroupMembership updatedMembership = groupMembershipService.updateMemberRole(
            group, targetUser, request.getRole(), currentUser);

        System.out.println("🔄 [DEBUG] Role update successful - New role: " + updatedMembership.getRole());

        return ResponseEntity.ok(convertToMemberResponse(updatedMembership));
    }

    /**
     * Remove a member from the group.
     */
    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            Authentication authentication) {

        System.out.println("🗑️ [DEBUG] Remove member endpoint called - GroupId: " + groupId + ", MemberId: " + memberId);

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);
        User memberToRemove = userService.getUserById(memberId);

        System.out.println("🗑️ [DEBUG] Current user: " + currentUser.getUsername() + " (ID: " + currentUser.getId() + ")");
        System.out.println("🗑️ [DEBUG] Member to remove: " + memberToRemove.getUsername() + " (ID: " + memberToRemove.getId() + ")");
        System.out.println("🗑️ [DEBUG] Group: " + group.getGroupName() + " (ID: " + group.getId() + ")");

        // Remove the member
        groupMembershipService.removeMember(currentUser, memberToRemove, group);

        System.out.println("🗑️ [DEBUG] Member removal successful");

        return ResponseEntity.ok().build();
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

    /**
     * Update group information.
     */
    @PutMapping("/{groupId}")
    public ResponseEntity<GroupResponseDto> updateGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody GroupUpdateRequestDto request,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);
        
        // Check if user is authorized to update the group (creator or admin)
        boolean isCreator = group.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = groupMembershipService.isAdmin(currentUser, group);
        
        if (!isCreator && !isAdmin) {
            throw new RuntimeException("Access denied - insufficient permissions to update this group");
        }
        
        Group updatedGroup = groupService.updateGroup(group, request);
        GroupResponseDto response = convertToDetailedResponse(updatedGroup, currentUser);

        return ResponseEntity.ok(response);
    }

    /**
     * Upload group picture for a specific group.
     */
    @PostMapping("/{groupId}/picture")
    public ResponseEntity<?> uploadGroupPicture(
            @PathVariable Long groupId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
            Group group = groupService.getGroupById(groupId);

            // Check if user is authorized (creator or admin)
            boolean isCreator = group.getCreator().getId().equals(currentUser.getId());
            boolean isAdmin = groupMembershipService.isAdmin(currentUser, group);

            if (!isCreator && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied - insufficient permissions to upload group picture");
            }

            // Get old group picture URL for deletion
            String oldGroupPictureUrl = group.getGroupPictureUrl();

            // Store the new file
            String fileName = fileStorageService.storeProfilePicture(file, groupId);

            // Generate the URL (relative path) - reuse profile-pictures directory
            String groupPictureUrl = "/api/files/profile-pictures/" + fileName;

            // Update group's picture URL
            Group updatedGroup = groupService.updateGroupPicture(groupId, groupPictureUrl);

            // Delete old group picture if it exists
            if (oldGroupPictureUrl != null && !oldGroupPictureUrl.isEmpty()) {
                String oldFileName = oldGroupPictureUrl.substring(oldGroupPictureUrl.lastIndexOf('/') + 1);
                fileStorageService.deleteFile(oldFileName);
            }

            GroupResponseDto response = convertToDetailedResponse(updatedGroup, currentUser);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to upload group picture: " + e.getMessage());
        }
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
        response.setAutoApproveMembers(group.getAutoApproveMembers());
        response.setTotalMessages(group.getTotalMessages());
        response.setLastMessageAt(group.getLastMessageAt());
        response.setCreatedAt(group.getCreatedAt());
        response.setUpdatedAt(group.getUpdatedAt());
        
        // Set user context based on membership
        boolean isUserMember = groupMembershipService.isMember(currentUser, group);
        response.setIsUserMember(isUserMember);

        if (isUserMember) {
            // Get the user's role in the group
            java.util.Optional<GroupMembership> membershipOpt = groupMembershipService.getUserMembership(currentUser, group);
            if (membershipOpt.isPresent()) {
                response.setUserRole(membershipOpt.get().getRole().name());
            } else {
                response.setUserRole(null);
            }
        } else {
            response.setUserRole(null);
        }
        
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
        response.setAutoApproveMembers(group.getAutoApproveMembers());
        response.setTotalMessages(group.getTotalMessages());
        response.setLastMessageAt(group.getLastMessageAt());
        response.setCreatedAt(group.getCreatedAt());

        // Check if current user is a member of this group
        boolean isUserMember = groupMembershipService.isMember(currentUser, group);
        response.setIsUserMember(isUserMember);

        // Fetch first 4 members for preview avatars
        List<GroupMembership> members = groupMembershipService.getGroupMembers(group);
        System.out.println("🔍 [GroupController] Group: " + group.getGroupName() +
                          ", Total members fetched: " + members.size());

        List<MemberPreviewDto> memberPreviews = members.stream()
            .limit(4)
            .map(this::convertToMemberPreview)
            .collect(Collectors.toList());

        System.out.println("🔍 [GroupController] Member previews created: " + memberPreviews.size());
        memberPreviews.forEach(mp ->
            System.out.println("   - Member: " + mp.getUsername() +
                              ", firstName: " + mp.getFirstName() +
                              ", lastName: " + mp.getLastName() +
                              ", profileImageUrl: " + mp.getProfileImageUrl())
        );

        response.setMemberPreviews(memberPreviews);

        return response;
    }

    private GroupMemberResponseDto convertToMemberResponse(GroupMembership membership) {
        GroupMemberResponseDto response = new GroupMemberResponseDto();
        User user = membership.getUser();

        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setDisplayName(user.getFullName()); // Use getFullName() to avoid lazy loading settings
        response.setEmail(user.getEmail());
        response.setProfilePictureUrl(user.getProfileImageUrl());
        response.setRole(membership.getRole());
        response.setIsActive(membership.getIsActive());
        response.setJoinedAt(membership.getJoinedAt());
        response.setLastActivityAt(membership.getLastActivityAt());
        response.setTotalBets(membership.getTotalBets());
        response.setTotalWins(membership.getTotalWins());
        response.setTotalLosses(membership.getTotalLosses());

        return response;
    }

    private MemberPreviewDto convertToMemberPreview(GroupMembership membership) {
        User user = membership.getUser();
        return new MemberPreviewDto(
            user.getId(),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getProfileImageUrl()
        );
    }

    // ==========================================
    // PENDING REQUEST ENDPOINTS
    // ==========================================

    /**
     * Get all pending join requests for a group.
     * Only accessible to group admins/officers.
     */
    @GetMapping("/{groupId}/pending-requests")
    public ResponseEntity<List<PendingRequestResponseDto>> getPendingRequests(
            @PathVariable Long groupId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Group group = groupService.getGroupById(groupId);

            // Get pending requests
            List<GroupMembership> pendingRequests = groupMembershipService.getPendingRequests(group);

            // Convert to DTOs
            List<PendingRequestResponseDto> response = pendingRequests.stream()
                .map(PendingRequestResponseDto::fromGroupMembership)
                .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("ERROR getting pending requests: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Get count of pending join requests for a group.
     * Only accessible to group admins/officers.
     */
    @GetMapping("/{groupId}/pending-requests/count")
    public ResponseEntity<Long> getPendingRequestCount(
            @PathVariable Long groupId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Group group = groupService.getGroupById(groupId);

            // Get pending request count
            Long count = groupMembershipService.getPendingRequestCount(group);

            return ResponseEntity.ok(count);

        } catch (Exception e) {
            System.err.println("ERROR getting pending request count: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Approve a pending join request.
     * Only accessible to group admins/officers.
     */
    @PostMapping("/{groupId}/pending-requests/{requestId}/approve")
    public ResponseEntity<Void> approvePendingRequest(
            @PathVariable Long groupId,
            @PathVariable Long requestId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Group group = groupService.getGroupById(groupId);

            // Approve the request
            groupMembershipService.approvePendingRequest(currentUser, requestId, group);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            System.err.println("ERROR approving pending request: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Deny/reject a pending join request.
     * Only accessible to group admins/officers.
     */
    @PostMapping("/{groupId}/pending-requests/{requestId}/deny")
    public ResponseEntity<Void> denyPendingRequest(
            @PathVariable Long groupId,
            @PathVariable Long requestId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Group group = groupService.getGroupById(groupId);

            // Deny the request
            groupMembershipService.denyPendingRequest(currentUser, requestId, group);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            System.err.println("ERROR denying pending request: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
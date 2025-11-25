package com.rivalpicks.controller;

import com.rivalpicks.dto.group.request.GroupCreationRequestDto;
import com.rivalpicks.dto.group.request.GroupUpdateRequestDto;
import com.rivalpicks.dto.group.request.UpdateMemberRoleRequestDto;
import com.rivalpicks.dto.group.request.InviteUserRequestDto;
import com.rivalpicks.dto.group.response.GroupResponseDto;
import com.rivalpicks.dto.group.response.GroupSummaryResponseDto;
import com.rivalpicks.dto.group.response.GroupMemberResponseDto;
import com.rivalpicks.dto.group.response.JoinGroupResponseDto;
import com.rivalpicks.dto.group.response.MemberPreviewDto;
import com.rivalpicks.dto.group.response.PendingRequestResponseDto;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.group.GroupMembership;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.group.GroupMembershipException;
import com.rivalpicks.service.group.GroupCreationService;
import com.rivalpicks.service.group.GroupMembershipService;
import com.rivalpicks.service.group.GroupService;
import com.rivalpicks.service.user.UserService;
import com.rivalpicks.service.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
     * Transfer group ownership to another member.
     * Only the current owner can transfer ownership.
     */
    @PostMapping("/{groupId}/transfer-ownership")
    public ResponseEntity<Map<String, String>> transferOwnership(
            @PathVariable Long groupId,
            @Valid @RequestBody com.rivalpicks.dto.group.request.TransferOwnershipRequestDto request,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);
        User newOwner = userService.getUserById(request.getNewOwnerId());

        // Transfer ownership
        groupMembershipService.transferOwnership(currentUser, newOwner, group);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Ownership transferred successfully");
        response.put("newOwnerId", newOwner.getId().toString());
        response.put("newOwnerUsername", newOwner.getUsername());

        return ResponseEntity.ok(response);
    }

    /**
     * Join a group.
     * For PUBLIC groups with auto-approve, user joins immediately as MEMBER.
     * For PRIVATE groups or groups without auto-approve, creates a pending request.
     */
    @PostMapping("/{groupId}/join")
    public ResponseEntity<JoinGroupResponseDto> joinGroup(
            @PathVariable Long groupId,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);

        // Join the group (service handles auto-approve logic)
        GroupMembership membership = groupMembershipService.joinGroup(currentUser, group);

        return ResponseEntity.ok(JoinGroupResponseDto.fromMembership(membership));
    }

    /**
     * Leave a group.
     * Any member can leave a group, except the only admin (must promote another admin first).
     */
    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Map<String, String>> leaveGroup(
            @PathVariable Long groupId,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);

        try {
            // Leave the group (service handles validation)
            groupMembershipService.leaveGroup(currentUser, group);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully left the group");
            response.put("groupId", groupId.toString());

            return ResponseEntity.ok(response);
        } catch (GroupMembershipException e) {
            // Handle specific business logic errors (e.g., only admin)
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
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

        // Check if user is authorized to update the group (owner or admin)
        boolean isOwner = group.isOwner(currentUser);
        boolean isAdmin = groupMembershipService.isAdmin(currentUser, group);

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Access denied - insufficient permissions to update this group");
        }

        Group updatedGroup = groupService.updateGroup(group, request);
        GroupResponseDto response = convertToDetailedResponse(updatedGroup, currentUser);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete a group.
     */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupId,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupService.getGroupById(groupId);

        // Only the owner can delete the group
        if (!group.isOwner(currentUser)) {
            throw new RuntimeException("Access denied - only the group owner can delete the group");
        }

        groupService.deleteGroup(group, currentUser);
        return ResponseEntity.noContent().build();
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

            // Check if user is authorized (owner or admin)
            boolean isOwner = group.isOwner(currentUser);
            boolean isAdmin = groupMembershipService.isAdmin(currentUser, group);

            if (!isOwner && !isAdmin) {
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
        response.setTotalMessages(group.getTotalMessages());
        response.setLastMessageAt(group.getLastMessageAt());
        response.setCreatedAt(group.getCreatedAt());
        response.setUpdatedAt(group.getUpdatedAt());

        // Set owner username
        if (group.getOwner() != null) {
            response.setOwnerUsername(group.getOwner().getUsername());
        }

        // Set user context based on membership
        // Use getAnyUserMembership to get ANY membership (including PENDING)
        java.util.Optional<GroupMembership> membershipOpt =
            groupMembershipService.getAnyUserMembership(currentUser, group);

        if (membershipOpt.isPresent()) {
            GroupMembership membership = membershipOpt.get();

            // Set membership status
            response.setUserMembershipStatus(membership.getStatus().name());

            // Set if user is member (only if APPROVED and active)
            boolean isUserMember = membership.getIsActive() &&
                                  membership.getStatus() == GroupMembership.MembershipStatus.APPROVED;
            response.setIsUserMember(isUserMember);

            // Set role if active member
            if (isUserMember) {
                response.setUserRole(membership.getRole().name());
            } else {
                response.setUserRole(null);
            }
        } else {
            response.setIsUserMember(false);
            response.setUserRole(null);
            response.setUserMembershipStatus(null);
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
        response.setOwnerUsername(group.getOwner().getUsername());
        response.setMemberCount(group.getMemberCount());
        response.setMaxMembers(group.getMaxMembers());
        response.setIsActive(group.getIsActive());
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

    /**
     * Invite a user to the group.
     * Only accessible to group admins and officers.
     * Invited users will join as regular MEMBER role.
     */
    @PostMapping("/{groupId}/invite")
    public ResponseEntity<GroupMemberResponseDto> inviteUser(
            @PathVariable Long groupId,
            @Valid @RequestBody InviteUserRequestDto request,
            Authentication authentication) {

        User currentUser = userService.getUserByUsername(authentication.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Group group = groupService.getGroupById(groupId);

        User userToInvite = userService.getUserByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found: " + request.getUsername()));

        // Always invite as MEMBER role
        GroupMembership membership = groupMembershipService.inviteUserToGroup(
            currentUser,
            userToInvite,
            group,
            GroupMembership.MemberRole.MEMBER
        );

        return ResponseEntity.ok(convertToMemberResponse(membership));
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

    // ==========================================
    // INVITATION ACCEPTANCE ENDPOINTS
    // ==========================================

    /**
     * Accept a group invitation.
     * The current user must be the invited user.
     */
    @PostMapping("/invitations/{membershipId}/accept")
    public ResponseEntity<GroupMemberResponseDto> acceptInvitation(
            @PathVariable Long membershipId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Accept the invitation
            GroupMembership membership = groupMembershipService.acceptInvitation(currentUser, membershipId);

            return ResponseEntity.ok(convertToMemberResponse(membership));

        } catch (Exception e) {
            System.err.println("ERROR accepting invitation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Reject a group invitation.
     * The current user must be the invited user.
     */
    @PostMapping("/invitations/{membershipId}/reject")
    public ResponseEntity<Void> rejectInvitation(
            @PathVariable Long membershipId,
            Authentication authentication) {

        try {
            User currentUser = userService.getUserByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Reject the invitation
            groupMembershipService.rejectInvitation(currentUser, membershipId);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            System.err.println("ERROR rejecting invitation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
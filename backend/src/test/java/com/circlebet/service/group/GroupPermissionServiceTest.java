package com.circlebet.service.group;

import com.circlebet.entity.group.Group;
import com.circlebet.entity.user.User;
import com.circlebet.repository.group.GroupMembershipRepository;
import com.circlebet.service.group.GroupPermissionService.GroupPermission;
import com.circlebet.service.group.GroupPermissionService.GroupPermissionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GroupPermissionServiceTest {

    @Mock
    private GroupMembershipRepository membershipRepository;

    @InjectMocks
    private GroupPermissionService permissionService;

    private User testUser;
    private User adminUser;
    private User moderatorUser;
    private User nonMemberUser;
    private Group publicGroup;
    private Group privateGroup;
    private Group inviteOnlyGroup;
    private Group fullGroup;
    private Group inactiveGroup;
    private Group deletedGroup;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        adminUser = new User();
        adminUser.setId(2L);
        adminUser.setUsername("admin");

        moderatorUser = new User();
        moderatorUser.setId(3L);
        moderatorUser.setUsername("moderator");

        nonMemberUser = new User();
        nonMemberUser.setId(4L);
        nonMemberUser.setUsername("nonmember");

        // Public group
        publicGroup = new Group();
        publicGroup.setId(1L);
        publicGroup.setGroupName("Public Group");
        publicGroup.setPrivacy(Group.Privacy.PUBLIC);
        publicGroup.setMaxMembers(50);
        publicGroup.setMemberCount(25);
        publicGroup.setIsActive(true);

        // Private group
        privateGroup = new Group();
        privateGroup.setId(2L);
        privateGroup.setGroupName("Private Group");
        privateGroup.setPrivacy(Group.Privacy.PRIVATE);
        privateGroup.setMaxMembers(30);
        privateGroup.setMemberCount(15);
        privateGroup.setIsActive(true);

        // Invite-only group
        inviteOnlyGroup = new Group();
        inviteOnlyGroup.setId(3L);
        inviteOnlyGroup.setGroupName("Invite Only Group");
        inviteOnlyGroup.setPrivacy(Group.Privacy.INVITE_ONLY);
        inviteOnlyGroup.setMaxMembers(20);
        inviteOnlyGroup.setMemberCount(10);
        inviteOnlyGroup.setIsActive(true);

        // Full group
        fullGroup = new Group();
        fullGroup.setId(4L);
        fullGroup.setGroupName("Full Group");
        fullGroup.setPrivacy(Group.Privacy.PUBLIC);
        fullGroup.setMaxMembers(10);
        fullGroup.setMemberCount(10);
        fullGroup.setIsActive(true);

        // Inactive group
        inactiveGroup = new Group();
        inactiveGroup.setId(5L);
        inactiveGroup.setGroupName("Inactive Group");
        inactiveGroup.setPrivacy(Group.Privacy.PUBLIC);
        inactiveGroup.setMaxMembers(50);
        inactiveGroup.setMemberCount(5);
        inactiveGroup.setIsActive(false);

        // Deleted group
        deletedGroup = new Group();
        deletedGroup.setId(6L);
        deletedGroup.setGroupName("Deleted Group");
        deletedGroup.setPrivacy(Group.Privacy.PUBLIC);
        deletedGroup.setMaxMembers(50);
        deletedGroup.setMemberCount(5);
        deletedGroup.setIsActive(true);
        deletedGroup.setDeletedAt(LocalDateTime.now());
    }

    // ===== canViewGroup Tests =====

    @Test
    @DisplayName("Should allow viewing public groups")
    void canViewGroup_PublicGroup_AllowsAccess() {
        boolean result = permissionService.canViewGroup(nonMemberUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow members to view private groups")
    void canViewGroup_PrivateGroupMember_AllowsAccess() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(testUser, privateGroup)).thenReturn(true);

        boolean result = permissionService.canViewGroup(testUser, privateGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny non-members from viewing private groups")
    void canViewGroup_PrivateGroupNonMember_DeniesAccess() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, privateGroup)).thenReturn(false);

        boolean result = permissionService.canViewGroup(nonMemberUser, privateGroup);
        assertFalse(result);
    }

    // ===== canJoinGroup Tests =====

    @Test
    @DisplayName("Should allow joining public groups with space")
    void canJoinGroup_PublicGroupWithSpace_AllowsJoining() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, publicGroup)).thenReturn(false);

        boolean result = permissionService.canJoinGroup(nonMemberUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny joining if already a member")
    void canJoinGroup_AlreadyMember_DeniesJoining() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(testUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canJoinGroup(testUser, publicGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should deny joining inactive groups")
    void canJoinGroup_InactiveGroup_DeniesJoining() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, inactiveGroup)).thenReturn(false);

        boolean result = permissionService.canJoinGroup(nonMemberUser, inactiveGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should deny joining deleted groups")
    void canJoinGroup_DeletedGroup_DeniesJoining() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, deletedGroup)).thenReturn(false);

        boolean result = permissionService.canJoinGroup(nonMemberUser, deletedGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should deny joining full groups")
    void canJoinGroup_FullGroup_DeniesJoining() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, fullGroup)).thenReturn(false);

        boolean result = permissionService.canJoinGroup(nonMemberUser, fullGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should deny joining private groups")
    void canJoinGroup_PrivateGroup_DeniesJoining() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, privateGroup)).thenReturn(false);

        boolean result = permissionService.canJoinGroup(nonMemberUser, privateGroup);
        assertFalse(result);
    }

    // ===== Permission-based Tests =====

    @Test
    @DisplayName("Should allow members to send messages")
    void canSendMessage_Member_AllowsAccess() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(testUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canSendMessage(testUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny non-members from sending messages")
    void canSendMessage_NonMember_DeniesAccess() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, publicGroup)).thenReturn(false);

        boolean result = permissionService.canSendMessage(nonMemberUser, publicGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should allow members to create bets")
    void canCreateBet_Member_AllowsAccess() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(testUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canCreateBet(testUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow admins to edit groups")
    void canEditGroup_Admin_AllowsAccess() {
        when(membershipRepository.isUserAdminOrModerator(adminUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canEditGroup(adminUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow moderators to edit groups")
    void canEditGroup_Moderator_AllowsAccess() {
        when(membershipRepository.isUserAdminOrModerator(moderatorUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canEditGroup(moderatorUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny regular members from editing groups")
    void canEditGroup_RegularMember_DeniesAccess() {
        when(membershipRepository.isUserAdminOrModerator(testUser, publicGroup)).thenReturn(false);

        boolean result = permissionService.canEditGroup(testUser, publicGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should allow only admins to delete groups")
    void canDeleteGroup_Admin_AllowsAccess() {
        when(membershipRepository.isUserGroupAdmin(adminUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canDeleteGroup(adminUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny moderators from deleting groups")
    void canDeleteGroup_Moderator_DeniesAccess() {
        when(membershipRepository.isUserGroupAdmin(moderatorUser, publicGroup)).thenReturn(false);

        boolean result = permissionService.canDeleteGroup(moderatorUser, publicGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should allow admins to invite users")
    void canInviteUsers_Admin_AllowsAccess() {
        when(membershipRepository.isUserAdminOrModerator(adminUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canInviteUsers(adminUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow moderators to invite users")
    void canInviteUsers_Moderator_AllowsAccess() {
        when(membershipRepository.isUserAdminOrModerator(moderatorUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canInviteUsers(moderatorUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow admins to remove members")
    void canRemoveMembers_Admin_AllowsAccess() {
        when(membershipRepository.isUserAdminOrModerator(adminUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canRemoveMembers(adminUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow only admins to change roles")
    void canChangeRoles_Admin_AllowsAccess() {
        when(membershipRepository.isUserGroupAdmin(adminUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canChangeRoles(adminUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should deny moderators from changing roles")
    void canChangeRoles_Moderator_DeniesAccess() {
        when(membershipRepository.isUserGroupAdmin(moderatorUser, publicGroup)).thenReturn(false);

        boolean result = permissionService.canChangeRoles(moderatorUser, publicGroup);
        assertFalse(result);
    }

    @Test
    @DisplayName("Should allow viewing members if can view group")
    void canViewMembers_CanViewGroup_AllowsAccess() {
        // Public group - anyone can view
        boolean result = permissionService.canViewMembers(nonMemberUser, publicGroup);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow members to view betting history")
    void canViewBettingHistory_Member_AllowsAccess() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(testUser, publicGroup)).thenReturn(true);

        boolean result = permissionService.canViewBettingHistory(testUser, publicGroup);
        assertTrue(result);
    }

    // ===== requirePermission Tests =====

    @Test
    @DisplayName("Should pass when user has required permission")
    void requirePermission_HasPermission_DoesNotThrow() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(testUser, publicGroup)).thenReturn(true);

        assertDoesNotThrow(() ->
            permissionService.requirePermission(testUser, publicGroup, GroupPermission.SEND_MESSAGE));
    }

    @Test
    @DisplayName("Should throw exception when user lacks required permission")
    void requirePermission_LacksPermission_ThrowsException() {
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, publicGroup)).thenReturn(false);

        GroupPermissionException exception = assertThrows(GroupPermissionException.class, () ->
            permissionService.requirePermission(nonMemberUser, publicGroup, GroupPermission.SEND_MESSAGE));

        assertTrue(exception.getMessage().contains("does not have permission"));
        assertTrue(exception.getMessage().contains("SEND_MESSAGE"));
    }

    @Test
    @DisplayName("Should test all permission types in requirePermission")
    void requirePermission_AllPermissionTypes() {
        // Setup mocks for various permissions
        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(testUser, publicGroup)).thenReturn(true);
        when(membershipRepository.isUserAdminOrModerator(testUser, publicGroup)).thenReturn(true);
        when(membershipRepository.isUserGroupAdmin(testUser, publicGroup)).thenReturn(true);

        // Test each permission type
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.VIEW_GROUP));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.SEND_MESSAGE));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.CREATE_BET));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.EDIT_GROUP));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.DELETE_GROUP));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.INVITE_USERS));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.REMOVE_MEMBERS));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.CHANGE_ROLES));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.VIEW_MEMBERS));
        assertDoesNotThrow(() -> permissionService.requirePermission(testUser, publicGroup, GroupPermission.VIEW_BETTING_HISTORY));
    }

    // ===== Edge Case Tests =====

    @Test
    @DisplayName("Should handle group with null max members")
    void canJoinGroup_NullMaxMembers_AllowsJoining() {
        Group groupWithNullMax = new Group();
        groupWithNullMax.setPrivacy(Group.Privacy.PUBLIC);
        groupWithNullMax.setMaxMembers(null);
        groupWithNullMax.setMemberCount(100);
        groupWithNullMax.setIsActive(true);

        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, groupWithNullMax)).thenReturn(false);

        boolean result = permissionService.canJoinGroup(nonMemberUser, groupWithNullMax);
        assertTrue(result);
    }

    @Test
    @DisplayName("Should handle group at exact capacity")
    void canJoinGroup_ExactCapacity_DeniesJoining() {
        Group exactCapacityGroup = new Group();
        exactCapacityGroup.setPrivacy(Group.Privacy.PUBLIC);
        exactCapacityGroup.setMaxMembers(10);
        exactCapacityGroup.setMemberCount(10);
        exactCapacityGroup.setIsActive(true);

        when(membershipRepository.existsByUserAndGroupAndIsActiveTrue(nonMemberUser, exactCapacityGroup)).thenReturn(false);

        boolean result = permissionService.canJoinGroup(nonMemberUser, exactCapacityGroup);
        assertFalse(result);
    }
}
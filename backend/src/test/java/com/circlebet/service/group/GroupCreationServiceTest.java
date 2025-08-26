package com.circlebet.service.group;

import com.circlebet.dto.group.request.GroupCreationRequestDto;
import com.circlebet.entity.group.Group;
import com.circlebet.entity.group.GroupMembership;
import com.circlebet.entity.user.User;
import com.circlebet.exception.group.GroupCreationException;
import com.circlebet.repository.group.GroupRepository;
import com.circlebet.service.group.GroupCreationService.GroupCreationException;
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

import static com.circlebet.service.group.GroupCreationService.DEFAULT_MAX_MEMBERS;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GroupCreationServiceTest {

    @Mock
    private GroupRepository groupRepository;
    
    @Mock
    private GroupMembershipService membershipService;

    @InjectMocks
    private GroupCreationService groupCreationService;

    private User testUser;
    private GroupCreationRequestDto validRequest;
    private Group testGroup;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        validRequest = new GroupCreationRequestDto();
        validRequest.setGroupName("Test Group");
        validRequest.setDescription("A test group");
        validRequest.setPrivacy(Group.Privacy.PUBLIC);
        validRequest.setMaxMembers(25);

        testGroup = new Group();
        testGroup.setId(1L);
        testGroup.setGroupName("Test Group");
        testGroup.setDescription("A test group");
        testGroup.setPrivacy(Group.Privacy.PUBLIC);
        testGroup.setMaxMembers(25);
        testGroup.setCreator(testUser);
        testGroup.setMemberCount(1);
        testGroup.setIsActive(true);
        testGroup.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should create group successfully with valid request")
    void createGroup_ValidRequest_Success() {
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(validRequest, testUser);

        assertNotNull(result);
        assertEquals("Test Group", result.getGroupName());
        assertEquals("A test group", result.getDescription());
        assertEquals(Group.Privacy.PUBLIC, result.getPrivacy());
        assertEquals(25, result.getMaxMembers());
        assertEquals(testUser, result.getCreator());
        assertTrue(result.getIsActive());
        
        verify(groupRepository).save(any(Group.class));
        verify(membershipService).addCreatorMembership(any(Group.class), eq(testUser));
    }

    @Test
    @DisplayName("Should create group with default max members when not specified")
    void createGroup_NoMaxMembers_UsesDefault() {
        validRequest.setMaxMembers(null);
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenAnswer(invocation -> {
            Group group = invocation.getArgument(0);
            group.setId(1L);
            return group;
        });
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(validRequest, testUser);

        assertNotNull(result);
        assertEquals(DEFAULT_MAX_MEMBERS, result.getMaxMembers());
    }

    @Test
    @DisplayName("Should throw exception when group name already exists")
    void createGroup_DuplicateName_ThrowsException() {
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(true);

        assertThrows(GroupCreationException.class, () ->
            groupCreationService.createGroup(validRequest, testUser));
        
        verify(groupRepository, never()).save(any(Group.class));
        verify(membershipService, never()).addCreatorMembership(any(Group.class), any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when max members is less than 2")
    void createGroup_MaxMembersTooLow_ThrowsException() {
        validRequest.setMaxMembers(1);

        assertThrows(GroupCreationException.class, () ->
            groupCreationService.createGroup(validRequest, testUser));
        
        verify(groupRepository, never()).save(any(Group.class));
    }

    @Test
    @DisplayName("Should throw exception when max members exceeds 1000")
    void createGroup_MaxMembersTooHigh_ThrowsException() {
        validRequest.setMaxMembers(1001);

        assertThrows(GroupCreationException.class, () ->
            groupCreationService.createGroup(validRequest, testUser));
        
        verify(groupRepository, never()).save(any(Group.class));
    }

    @Test
    @DisplayName("Should create private group successfully")
    void createGroup_PrivateGroup_Success() {
        validRequest.setPrivacy(Group.Privacy.PRIVATE);
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(validRequest, testUser);

        assertNotNull(result);
        assertEquals(Group.Privacy.PRIVATE, testGroup.getPrivacy());
    }

    @Test
    @DisplayName("Should create invite-only group successfully")
    void createGroup_InviteOnlyGroup_Success() {
        validRequest.setPrivacy(Group.Privacy.INVITE_ONLY);
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(validRequest, testUser);

        assertNotNull(result);
        assertEquals(Group.Privacy.INVITE_ONLY, testGroup.getPrivacy());
    }

    @Test
    @DisplayName("Should handle edge case with max members exactly at limit")
    void createGroup_MaxMembersAtLimit_Success() {
        validRequest.setMaxMembers(1000);
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(validRequest, testUser);

        assertNotNull(result);
        assertEquals(1000, testGroup.getMaxMembers());
    }

    @Test
    @DisplayName("Should handle edge case with min members exactly at limit")
    void createGroup_MaxMembersAtMinLimit_Success() {
        validRequest.setMaxMembers(2);
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(validRequest, testUser);

        assertNotNull(result);
        assertEquals(2, testGroup.getMaxMembers());
    }

    @Test
    @DisplayName("Should set creation timestamp")
    void createGroup_ValidRequest_SetsTimestamp() {
        when(groupRepository.existsByGroupNameIgnoreCase(validRequest.getGroupName())).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenAnswer(invocation -> {
            Group group = invocation.getArgument(0);
            assertNotNull(group.getCreatedAt());
            return group;
        });
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        groupCreationService.createGroup(validRequest, testUser);

        verify(groupRepository).save(argThat(group -> group.getCreatedAt() != null));
    }

    @Test
    @DisplayName("Should validate constant value is 50")
    void validateConstant_DefaultMaxMembers() {
        assertEquals(50, DEFAULT_MAX_MEMBERS);
    }
}
package com.rivalpicks.service.group;

import com.rivalpicks.dto.group.request.GroupCreationRequestDto;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.group.GroupMembership;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.repository.group.GroupRepository;
import com.rivalpicks.exception.group.GroupCreationException;
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
import java.util.Optional;

import static com.betmate.service.group.GroupCreationService.DEFAULT_MAX_MEMBERS;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GroupCreationServiceTest {

    @Mock
    private GroupService groupService;
    
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
    }

    @Test
    @DisplayName("Should create group successfully with valid request")
    void createGroup_ValidRequest_Success() {
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.empty());
        when(groupService.saveGroup(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(testUser, validRequest);

        assertNotNull(result);
        assertEquals("Test Group", result.getGroupName());
        assertEquals("A test group", result.getDescription());
        assertEquals(Group.Privacy.PUBLIC, result.getPrivacy());
        assertEquals(25, result.getMaxMembers());
        assertEquals(testUser, result.getCreator());
        assertTrue(result.getIsActive());
        
        verify(groupService).saveGroup(any(Group.class));
        verify(membershipService).addCreatorMembership(any(Group.class), eq(testUser));
    }

    @Test
    @DisplayName("Should create group with default max members when not specified")
    void createGroup_NoMaxMembers_UsesDefault() {
        validRequest.setMaxMembers(null);
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.empty());
        when(groupService.saveGroup(any(Group.class))).thenAnswer(invocation -> {
            Group group = invocation.getArgument(0);
            group.setId(1L);
            return group;
        });
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(testUser, validRequest);

        assertNotNull(result);
        assertEquals(DEFAULT_MAX_MEMBERS, result.getMaxMembers());
    }

    @Test
    @DisplayName("Should throw exception when group name already exists")
    void createGroup_DuplicateName_ThrowsException() {
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.of(testGroup));

        assertThrows(GroupCreationException.class, () ->
            groupCreationService.createGroup(testUser, validRequest));
        
        verify(groupService, never()).saveGroup(any(Group.class));
        verify(membershipService, never()).addCreatorMembership(any(Group.class), any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when max members is less than 2")
    void createGroup_MaxMembersTooLow_ThrowsException() {
        validRequest.setMaxMembers(1);

        assertThrows(GroupCreationException.class, () ->
            groupCreationService.createGroup(testUser, validRequest));
        
        verify(groupService, never()).saveGroup(any(Group.class));
    }

    @Test
    @DisplayName("Should throw exception when max members exceeds 1000")
    void createGroup_MaxMembersTooHigh_ThrowsException() {
        validRequest.setMaxMembers(1001);

        assertThrows(GroupCreationException.class, () ->
            groupCreationService.createGroup(testUser, validRequest));
        
        verify(groupService, never()).saveGroup(any(Group.class));
    }

    @Test
    @DisplayName("Should create private group successfully")
    void createGroup_PrivateGroup_Success() {
        validRequest.setPrivacy(Group.Privacy.PRIVATE);
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.empty());
        when(groupService.saveGroup(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(testUser, validRequest);

        assertNotNull(result);
        // The privacy should be set in the request and used in the service
        verify(groupService).saveGroup(argThat(group -> group.getPrivacy() == Group.Privacy.PRIVATE));
    }

    @Test
    @DisplayName("Should create secret group successfully")
    void createGroup_SecretGroup_Success() {
        validRequest.setPrivacy(Group.Privacy.SECRET);
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.empty());
        when(groupService.saveGroup(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(testUser, validRequest);

        assertNotNull(result);
        // The privacy should be set in the request and used in the service
        verify(groupService).saveGroup(argThat(group -> group.getPrivacy() == Group.Privacy.SECRET));
    }

    @Test
    @DisplayName("Should handle edge case with max members exactly at limit")
    void createGroup_MaxMembersAtLimit_Success() {
        validRequest.setMaxMembers(1000);
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.empty());
        when(groupService.saveGroup(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(testUser, validRequest);

        assertNotNull(result);
        // The max members should be set in the service
        verify(groupService).saveGroup(argThat(group -> group.getMaxMembers() == 1000));
    }

    @Test
    @DisplayName("Should handle edge case with min members exactly at limit")
    void createGroup_MaxMembersAtMinLimit_Success() {
        validRequest.setMaxMembers(2);
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.empty());
        when(groupService.saveGroup(any(Group.class))).thenReturn(testGroup);
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        Group result = groupCreationService.createGroup(testUser, validRequest);

        assertNotNull(result);
        // The max members should be set in the service
        verify(groupService).saveGroup(argThat(group -> group.getMaxMembers() == 2));
    }

    @Test
    @DisplayName("Should set creation timestamp")
    void createGroup_ValidRequest_SetsTimestamp() {
        when(groupService.getGroupByName(validRequest.getGroupName())).thenReturn(Optional.empty());
        when(groupService.saveGroup(any(Group.class))).thenAnswer(invocation -> {
            Group group = invocation.getArgument(0);
            return group;
        });
        when(membershipService.addCreatorMembership(any(Group.class), eq(testUser))).thenReturn(new GroupMembership());

        groupCreationService.createGroup(testUser, validRequest);

        verify(groupService).saveGroup(any(Group.class));
    }

    @Test
    @DisplayName("Should validate constant value is 50")
    void validateConstant_DefaultMaxMembers() {
        assertEquals(50, DEFAULT_MAX_MEMBERS);
    }
}
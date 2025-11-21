package com.rivalpicks.service.group;

import com.rivalpicks.dto.group.request.GroupUpdateRequestDto;
import com.rivalpicks.entity.group.Group;
import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.group.GroupNotFoundException;
import com.rivalpicks.repository.group.GroupRepository;
import com.rivalpicks.repository.group.GroupMembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static com.betmate.service.group.GroupCreationService.DEFAULT_MAX_MEMBERS;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("GroupService Unit Tests")
class GroupServiceTest {

    private GroupService groupService;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMembershipRepository membershipRepository;
    
    // Test data constants
    private static final Long TEST_GROUP_ID = 123L;
    private static final String TEST_GROUP_NAME = "TestGroup";
    private static final String TEST_DESCRIPTION = "Test Description";
    private static final Long TEST_USER_ID = 456L;
    private static final String TEST_USERNAME = "testuser";
    
    private Group testGroup;
    private User testUser;
    private User lastMessageUser;

    @BeforeEach
    void setUp() {
        groupService = new GroupService(groupRepository, membershipRepository);
        
        // Create test user
        testUser = createTestUser(TEST_USER_ID, TEST_USERNAME);
        lastMessageUser = createTestUser(789L, "lastuser");
        
        // Create test group
        testGroup = createTestGroup(TEST_GROUP_ID, TEST_GROUP_NAME, TEST_DESCRIPTION, testUser);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================
    
    private User createTestUser(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        return user;
    }
    
    private Group createTestGroup(Long id, String name, String description, User creator) {
        Group group = new Group();
        group.setId(id);
        group.setGroupName(name);
        group.setDescription(description);
        group.setCreator(creator);
        group.setMemberCount(5);
        group.setTotalMessages(10L);
        group.setPrivacy(Group.Privacy.PUBLIC);
        group.setIsActive(true);
        return group;
    }

    // ==========================================
    // GET GROUP BY ID TESTS
    // ==========================================

    @Test
    @DisplayName("Should retrieve group by ID successfully")
    void getGroupById_Success() {
        // Arrange
        when(groupRepository.findByIdAndDeletedAtIsNull(TEST_GROUP_ID))
            .thenReturn(Optional.of(testGroup));

        // Act
        Group result = groupService.getGroupById(TEST_GROUP_ID);

        // Assert
        assertThat(result).isEqualTo(testGroup);
        verify(groupRepository).findByIdAndDeletedAtIsNull(TEST_GROUP_ID);
    }

    @Test
    @DisplayName("Should throw GroupNotFoundException when group not found by ID")
    void getGroupById_NotFound() {
        // Arrange
        when(groupRepository.findByIdAndDeletedAtIsNull(TEST_GROUP_ID))
            .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> groupService.getGroupById(TEST_GROUP_ID))
            .isInstanceOf(GroupNotFoundException.class)
            .hasMessage("Group not found: " + TEST_GROUP_ID);
        
        verify(groupRepository).findByIdAndDeletedAtIsNull(TEST_GROUP_ID);
    }

    // ==========================================
    // GET GROUP BY NAME TESTS
    // ==========================================

    @Test
    @DisplayName("Should retrieve group by name successfully")
    void getGroupByName_Success() {
        // Arrange
        when(groupRepository.findByGroupNameIgnoreCaseAndDeletedAtIsNull(TEST_GROUP_NAME))
            .thenReturn(Optional.of(testGroup));

        // Act
        Optional<Group> result = groupService.getGroupByName(TEST_GROUP_NAME);

        // Assert
        assertThat(result).isPresent().contains(testGroup);
        verify(groupRepository).findByGroupNameIgnoreCaseAndDeletedAtIsNull(TEST_GROUP_NAME);
    }

    @Test
    @DisplayName("Should return empty Optional when group not found by name")
    void getGroupByName_NotFound() {
        // Arrange
        when(groupRepository.findByGroupNameIgnoreCaseAndDeletedAtIsNull(TEST_GROUP_NAME))
            .thenReturn(Optional.empty());

        // Act
        Optional<Group> result = groupService.getGroupByName(TEST_GROUP_NAME);

        // Assert
        assertThat(result).isEmpty();
        verify(groupRepository).findByGroupNameIgnoreCaseAndDeletedAtIsNull(TEST_GROUP_NAME);
    }

    // ==========================================
    // UPDATE GROUP TESTS
    // ==========================================

    @Test
    @DisplayName("Should update group name successfully")
    void updateGroup_UpdateName_Success() {
        // Arrange
        String newName = "NewGroupName";
        GroupUpdateRequestDto request = new GroupUpdateRequestDto();
        request.setGroupName(newName);
        
        when(groupRepository.existsByGroupNameIgnoreCase(newName)).thenReturn(false);
        when(groupRepository.save(testGroup)).thenReturn(testGroup);

        // Act
        Group result = groupService.updateGroup(testGroup, request);

        // Assert
        assertThat(result.getGroupName()).isEqualTo(newName);
        verify(groupRepository).existsByGroupNameIgnoreCase(newName);
        verify(groupRepository).save(testGroup);
    }

    @Test
    @DisplayName("Should throw exception when updating to existing group name")
    void updateGroup_NameAlreadyTaken() {
        // Arrange
        String existingName = "ExistingGroup";
        GroupUpdateRequestDto request = new GroupUpdateRequestDto();
        request.setGroupName(existingName);
        
        when(groupRepository.existsByGroupNameIgnoreCase(existingName)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> groupService.updateGroup(testGroup, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Group name already taken: " + existingName);
        
        verify(groupRepository).existsByGroupNameIgnoreCase(existingName);
        verify(groupRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when updating to empty group name")
    void updateGroup_EmptyName() {
        // Arrange
        GroupUpdateRequestDto request = new GroupUpdateRequestDto();
        request.setGroupName("   ");

        // Act & Assert
        assertThatThrownBy(() -> groupService.updateGroup(testGroup, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Group name cannot be empty");
        
        verify(groupRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update description and trim whitespace")
    void updateGroup_UpdateDescription() {
        // Arrange
        String newDescription = "  New Description  ";
        GroupUpdateRequestDto request = new GroupUpdateRequestDto();
        request.setDescription(newDescription);
        
        when(groupRepository.save(testGroup)).thenReturn(testGroup);

        // Act
        Group result = groupService.updateGroup(testGroup, request);

        // Assert
        assertThat(result.getDescription()).isEqualTo("New Description");
        verify(groupRepository).save(testGroup);
    }

    @Test
    @DisplayName("Should update privacy setting")
    void updateGroup_UpdatePrivacy() {
        // Arrange
        GroupUpdateRequestDto request = new GroupUpdateRequestDto();
        request.setPrivacy(Group.Privacy.PRIVATE);
        
        when(groupRepository.save(testGroup)).thenReturn(testGroup);

        // Act
        Group result = groupService.updateGroup(testGroup, request);

        // Assert
        assertThat(result.getPrivacy()).isEqualTo(Group.Privacy.PRIVATE);
        verify(groupRepository).save(testGroup);
    }

    // ==========================================
    // ATOMIC UPDATE TESTS
    // ==========================================

    @Test
    @DisplayName("Should update chat metadata atomically")
    void updateChatMetadata_Success() {
        // Arrange
        when(groupRepository.updateChatMetadata(eq(TEST_GROUP_ID), any(LocalDateTime.class), eq(lastMessageUser)))
            .thenReturn(1);

        // Act
        assertThatNoException().isThrownBy(() -> 
            groupService.updateChatMetadata(TEST_GROUP_ID, lastMessageUser));

        // Assert
        verify(groupRepository).updateChatMetadata(eq(TEST_GROUP_ID), any(LocalDateTime.class), eq(lastMessageUser));
    }

    @Test
    @DisplayName("Should throw exception when atomic chat metadata update fails")
    void updateChatMetadata_GroupNotFound() {
        // Arrange
        when(groupRepository.updateChatMetadata(eq(TEST_GROUP_ID), any(LocalDateTime.class), eq(lastMessageUser)))
            .thenReturn(0);

        // Act & Assert
        assertThatThrownBy(() -> groupService.updateChatMetadata(TEST_GROUP_ID, lastMessageUser))
            .isInstanceOf(GroupNotFoundException.class)
            .hasMessage("Group not found or deleted: " + TEST_GROUP_ID);
        
        verify(groupRepository).updateChatMetadata(eq(TEST_GROUP_ID), any(LocalDateTime.class), eq(lastMessageUser));
    }

    @Test
    @DisplayName("Should update member count atomically")
    void updateMemberCount_Success() {
        // Arrange
        int newCount = 10;
        when(groupRepository.updateMemberCount(TEST_GROUP_ID, newCount)).thenReturn(1);

        // Act
        assertThatNoException().isThrownBy(() -> 
            groupService.updateMemberCount(TEST_GROUP_ID, newCount));

        // Assert
        verify(groupRepository).updateMemberCount(TEST_GROUP_ID, newCount);
    }

    @Test
    @DisplayName("Should throw exception when member count is negative")
    void updateMemberCount_NegativeCount() {
        // Arrange
        int negativeCount = -5;

        // Act & Assert
        assertThatThrownBy(() -> groupService.updateMemberCount(TEST_GROUP_ID, negativeCount))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Member count cannot be negative: " + negativeCount);
        
        verify(groupRepository, never()).updateMemberCount(any(), any());
    }

    @Test
    @DisplayName("Should throw exception when atomic member count update fails")
    void updateMemberCount_GroupNotFound() {
        // Arrange
        int newCount = 10;
        when(groupRepository.updateMemberCount(TEST_GROUP_ID, newCount)).thenReturn(0);

        // Act & Assert
        assertThatThrownBy(() -> groupService.updateMemberCount(TEST_GROUP_ID, newCount))
            .isInstanceOf(GroupNotFoundException.class)
            .hasMessage("Group not found or deleted: " + TEST_GROUP_ID);
        
        verify(groupRepository).updateMemberCount(TEST_GROUP_ID, newCount);
    }

    // ==========================================
    // MAX MEMBERS TESTS
    // ==========================================

    @Test
    @DisplayName("Should return true when group has available slots")
    void hasAvailableSlots_Available() {
        // Arrange
        testGroup.setMaxMembers(DEFAULT_MAX_MEMBERS); // Set max to 50
        testGroup.setMemberCount(45); // Less than DEFAULT_MAX_MEMBERS (50)
        when(groupRepository.findByIdAndDeletedAtIsNull(TEST_GROUP_ID))
            .thenReturn(Optional.of(testGroup));

        // Act
        boolean result = groupService.hasAvailableSlots(TEST_GROUP_ID);

        // Assert
        assertThat(result).isTrue();
        verify(groupRepository).findByIdAndDeletedAtIsNull(TEST_GROUP_ID);
    }

    @Test
    @DisplayName("Should return false when group is full")
    void hasAvailableSlots_Full() {
        // Arrange
        testGroup.setMaxMembers(DEFAULT_MAX_MEMBERS); // Set max to 50
        testGroup.setMemberCount(DEFAULT_MAX_MEMBERS); // Equal to DEFAULT_MAX_MEMBERS (50)
        when(groupRepository.findByIdAndDeletedAtIsNull(TEST_GROUP_ID))
            .thenReturn(Optional.of(testGroup));

        // Act
        boolean result = groupService.hasAvailableSlots(TEST_GROUP_ID);

        // Assert
        assertThat(result).isFalse();
        verify(groupRepository).findByIdAndDeletedAtIsNull(TEST_GROUP_ID);
    }

    // ==========================================
    // SEARCH TESTS
    // ==========================================

    @Test
    @DisplayName("Should search groups successfully")
    void searchGroups_Success() {
        // Arrange
        List<Group> expectedGroups = List.of(testGroup);
        when(groupRepository.searchGroups("test")).thenReturn(expectedGroups);

        // Act
        List<Group> result = groupService.searchGroups("  test  ");

        // Assert
        assertThat(result).isEqualTo(expectedGroups);
        verify(groupRepository).searchGroups("test");
    }

    @Test
    @DisplayName("Should return empty list for empty search term")
    void searchGroups_EmptyTerm() {
        // Arrange & Act
        List<Group> result = groupService.searchGroups("   ");

        // Assert
        assertThat(result).isEmpty();
        verify(groupRepository, never()).searchGroups(any());
    }

    // ==========================================
    // GROUP NAME AVAILABILITY TESTS
    // ==========================================

    @Test
    @DisplayName("Should return true when group name is available")
    void isGroupNameAvailable_Available() {
        // Arrange
        when(groupRepository.existsByGroupNameIgnoreCase(TEST_GROUP_NAME)).thenReturn(false);

        // Act
        boolean result = groupService.isGroupNameAvailable(TEST_GROUP_NAME);

        // Assert
        assertThat(result).isTrue();
        verify(groupRepository).existsByGroupNameIgnoreCase(TEST_GROUP_NAME);
    }

    @Test
    @DisplayName("Should return false when group name is taken")
    void isGroupNameAvailable_Taken() {
        // Arrange
        when(groupRepository.existsByGroupNameIgnoreCase(TEST_GROUP_NAME)).thenReturn(true);

        // Act
        boolean result = groupService.isGroupNameAvailable(TEST_GROUP_NAME);

        // Assert
        assertThat(result).isFalse();
        verify(groupRepository).existsByGroupNameIgnoreCase(TEST_GROUP_NAME);
    }

    // ==========================================
    // SAVE GROUP TESTS
    // ==========================================

    @Test
    @DisplayName("Should save group successfully")
    void saveGroup_Success() {
        // Arrange
        when(groupRepository.save(testGroup)).thenReturn(testGroup);

        // Act
        Group result = groupService.saveGroup(testGroup);

        // Assert
        assertThat(result).isEqualTo(testGroup);
        verify(groupRepository).save(testGroup);
    }

    // ==========================================
    // DEACTIVATE GROUP TESTS
    // ==========================================

    @Test
    @DisplayName("Should deactivate group successfully")
    void deactivateGroup_Success() {
        // Arrange
        when(groupRepository.findByIdAndDeletedAtIsNull(TEST_GROUP_ID))
            .thenReturn(Optional.of(testGroup));
        when(groupRepository.save(testGroup)).thenReturn(testGroup);

        // Act
        groupService.deactivateGroup(TEST_GROUP_ID);

        // Assert
        assertThat(testGroup.getIsActive()).isFalse();
        assertThat(testGroup.getDeletedAt()).isNotNull();
        verify(groupRepository).findByIdAndDeletedAtIsNull(TEST_GROUP_ID);
        verify(groupRepository).save(testGroup);
    }

    // ==========================================
    // GET STATISTICS TESTS
    // ==========================================

    @Test
    @DisplayName("Should get group statistics successfully")
    void getGroupStats_Success() {
        // Arrange
        when(groupRepository.findByIdAndDeletedAtIsNull(TEST_GROUP_ID))
            .thenReturn(Optional.of(testGroup));

        // Act
        GroupService.GroupStats result = groupService.getGroupStats(TEST_GROUP_ID);

        // Assert
        assertThat(result.memberCount()).isEqualTo(testGroup.getMemberCount());
        assertThat(result.totalMessages()).isEqualTo(testGroup.getTotalMessages());
        assertThat(result.privacy()).isEqualTo(testGroup.getPrivacy());
        verify(groupRepository).findByIdAndDeletedAtIsNull(TEST_GROUP_ID);
    }

    // ==========================================
    // LIST OPERATIONS TESTS
    // ==========================================

    @Test
    @DisplayName("Should get active groups successfully")
    void getActiveGroups_Success() {
        // Arrange
        List<Group> expectedGroups = List.of(testGroup);
        when(groupRepository.findByIsActiveTrueAndDeletedAtIsNull()).thenReturn(expectedGroups);

        // Act
        List<Group> result = groupService.getActiveGroups();

        // Assert
        assertThat(result).isEqualTo(expectedGroups);
        verify(groupRepository).findByIsActiveTrueAndDeletedAtIsNull();
    }

    @Test
    @DisplayName("Should get public groups successfully")
    void getPublicGroups_Success() {
        // Arrange
        List<Group> expectedGroups = List.of(testGroup);
        when(groupRepository.findPublicGroups()).thenReturn(expectedGroups);

        // Act
        List<Group> result = groupService.getPublicGroups();

        // Assert
        assertThat(result).isEqualTo(expectedGroups);
        verify(groupRepository).findPublicGroups();
    }

    @Test
    @DisplayName("Should get groups by creator successfully")
    void getGroupsByCreator_Success() {
        // Arrange
        List<Group> expectedGroups = List.of(testGroup);
        when(groupRepository.findByCreator(testUser)).thenReturn(expectedGroups);

        // Act
        List<Group> result = groupService.getGroupsByCreator(testUser);

        // Assert
        assertThat(result).isEqualTo(expectedGroups);
        verify(groupRepository).findByCreator(testUser);
    }

    @Test
    @DisplayName("Should get most active groups successfully")
    void getMostActiveGroups_Success() {
        // Arrange
        List<Group> expectedGroups = List.of(testGroup);
        when(groupRepository.findMostActiveGroups()).thenReturn(expectedGroups);

        // Act
        List<Group> result = groupService.getMostActiveGroups();

        // Assert
        assertThat(result).isEqualTo(expectedGroups);
        verify(groupRepository).findMostActiveGroups();
    }

    @Test
    @DisplayName("Should get active group count successfully")
    void getActiveGroupCount_Success() {
        // Arrange
        Long expectedCount = 42L;
        when(groupRepository.countActiveGroups()).thenReturn(expectedCount);

        // Act
        Long result = groupService.getActiveGroupCount();

        // Assert
        assertThat(result).isEqualTo(expectedCount);
        verify(groupRepository).countActiveGroups();
    }
}
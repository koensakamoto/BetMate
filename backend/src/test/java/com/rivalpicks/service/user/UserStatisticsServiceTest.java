package com.rivalpicks.service.user;

import com.rivalpicks.entity.user.User;
import com.rivalpicks.exception.user.UserNotFoundException;
import com.rivalpicks.service.user.UserStatisticsService.UserStatistics;
import com.rivalpicks.service.user.UserStatisticsService.StatisticsUpdate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;

@DisplayName("UserStatisticsService Unit Tests")
class UserStatisticsServiceTest {

    private UserStatisticsService statisticsService;
    private TestUserService userService;
    
    // Test data constants
    private static final Long TEST_USER_ID = 123L;
    private static final Long NON_EXISTENT_USER_ID = 999L;
    
    private User testUser;
    private User newUser;

    @BeforeEach
    void setUp() {
        userService = new TestUserService();
        statisticsService = new UserStatisticsService(userService);
        
        // Create test users with different statistics
        testUser = createTestUser(TEST_USER_ID, 10, 5, 3, 7, 2); // Experienced user
        newUser = createTestUser(2L, 0, 0, 0, 0, 0); // New user
        
        // Setup users in test service
        userService.addUser(testUser);
        userService.addUser(newUser);
    }
    
    private User createTestUser(Long id, int winCount, int lossCount, int currentStreak, 
                               int longestStreak, int activeBets) {
        User user = new User();
        user.setId(id);
        user.setUsername("testuser" + id);
        user.setEmail("test" + id + "@example.com");
        user.setWinCount(winCount);
        user.setLossCount(lossCount);
        user.setCurrentStreak(currentStreak);
        user.setLongestStreak(longestStreak);
        user.setActiveBets(activeBets);
        user.setCreditBalance(BigDecimal.valueOf(100.0));
        user.setIsActive(true);
        user.setEmailVerified(true);
        return user;
    }

    // ==================== Test Helper Classes ====================
    
    private static class TestUserService extends UserService {
        private final Map<Long, User> users = new HashMap<>();
        private final AtomicLong idGenerator = new AtomicLong(1000);

        public TestUserService() {
            super(null, null); // We'll override all methods we need
        }

        @Override
        public User getUserById(Long userId) {
            User user = users.get(userId);
            if (user == null || user.isDeleted()) {
                throw new UserNotFoundException("User not found: " + userId);
            }
            return user;
        }

        @Override
        public User saveUser(User user) {
            if (user.getId() == null) {
                user.setId(idGenerator.getAndIncrement());
            }
            users.put(user.getId(), user);
            return user;
        }

        public void addUser(User user) {
            users.put(user.getId(), user);
        }

        public User getStoredUser(Long userId) {
            return users.get(userId);
        }

        public void reset() {
            users.clear();
        }
    }

    // ==================== recordWin Tests ====================

    @Test
    @DisplayName("Should record win and update statistics correctly")
    void should_RecordWin_When_ValidUserId() {
        // Given
        int initialWinCount = testUser.getWinCount();
        int initialStreak = testUser.getCurrentStreak();
        int initialLongestStreak = testUser.getLongestStreak();
        
        // When
        statisticsService.recordWin(TEST_USER_ID);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getWinCount()).isEqualTo(initialWinCount + 1);
        assertThat(updatedUser.getCurrentStreak()).isEqualTo(initialStreak + 1);
        assertThat(updatedUser.getLongestStreak()).isEqualTo(Math.max(initialLongestStreak, initialStreak + 1));
    }

    @Test
    @DisplayName("Should update longest streak when current streak exceeds it")
    void should_UpdateLongestStreak_When_CurrentStreakExceeds() {
        // Given
        User user = createTestUser(10L, 5, 3, 6, 5, 0); // Current streak (6) > longest (5)
        userService.addUser(user);
        
        // When
        statisticsService.recordWin(10L);
        
        // Then
        User updatedUser = userService.getStoredUser(10L);
        assertThat(updatedUser.getCurrentStreak()).isEqualTo(7);
        assertThat(updatedUser.getLongestStreak()).isEqualTo(7); // Should be updated
    }

    @Test
    @DisplayName("Should not update longest streak when current streak doesn't exceed it")
    void should_NotUpdateLongestStreak_When_CurrentStreakDoesNotExceed() {
        // Given
        User user = createTestUser(11L, 5, 3, 2, 10, 0); // Current streak (2) < longest (10)
        userService.addUser(user);
        
        // When
        statisticsService.recordWin(11L);
        
        // Then
        User updatedUser = userService.getStoredUser(11L);
        assertThat(updatedUser.getCurrentStreak()).isEqualTo(3);
        assertThat(updatedUser.getLongestStreak()).isEqualTo(10); // Should remain unchanged
    }

    @Test
    @DisplayName("Should throw exception when recording win for non-existent user")
    void should_ThrowException_When_RecordingWinForNonExistentUser() {
        // When & Then
        assertThatThrownBy(() -> statisticsService.recordWin(NON_EXISTENT_USER_ID))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: " + NON_EXISTENT_USER_ID);
    }

    // ==================== recordLoss Tests ====================

    @Test
    @DisplayName("Should record loss and reset current streak")
    void should_RecordLoss_When_ValidUserId() {
        // Given
        int initialLossCount = testUser.getLossCount();
        int initialLongestStreak = testUser.getLongestStreak();
        
        // When
        statisticsService.recordLoss(TEST_USER_ID);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getLossCount()).isEqualTo(initialLossCount + 1);
        assertThat(updatedUser.getCurrentStreak()).isZero(); // Should be reset
        assertThat(updatedUser.getLongestStreak()).isEqualTo(initialLongestStreak); // Should remain unchanged
    }

    @Test
    @DisplayName("Should throw exception when recording loss for non-existent user")
    void should_ThrowException_When_RecordingLossForNonExistentUser() {
        // When & Then
        assertThatThrownBy(() -> statisticsService.recordLoss(NON_EXISTENT_USER_ID))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: " + NON_EXISTENT_USER_ID);
    }

    // ==================== incrementActiveBets Tests ====================

    @Test
    @DisplayName("Should increment active bets count")
    void should_IncrementActiveBets_When_ValidUserId() {
        // Given
        int initialActiveBets = testUser.getActiveBets();
        
        // When
        statisticsService.incrementActiveBets(TEST_USER_ID);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getActiveBets()).isEqualTo(initialActiveBets + 1);
    }

    @Test
    @DisplayName("Should throw exception when incrementing active bets for non-existent user")
    void should_ThrowException_When_IncrementingActiveBetsForNonExistentUser() {
        // When & Then
        assertThatThrownBy(() -> statisticsService.incrementActiveBets(NON_EXISTENT_USER_ID))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: " + NON_EXISTENT_USER_ID);
    }

    // ==================== decrementActiveBets Tests ====================

    @Test
    @DisplayName("Should decrement active bets count")
    void should_DecrementActiveBets_When_ValidUserId() {
        // Given
        int initialActiveBets = testUser.getActiveBets();
        
        // When
        statisticsService.decrementActiveBets(TEST_USER_ID);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getActiveBets()).isEqualTo(initialActiveBets - 1);
    }

    @Test
    @DisplayName("Should not decrement active bets below zero")
    void should_NotDecrementActiveBetsBelowZero_When_AlreadyZero() {
        // Given
        User userWithZeroBets = createTestUser(12L, 5, 3, 2, 5, 0);
        userService.addUser(userWithZeroBets);
        
        // When
        statisticsService.decrementActiveBets(12L);
        
        // Then
        User updatedUser = userService.getStoredUser(12L);
        assertThat(updatedUser.getActiveBets()).isZero(); // Should remain 0
    }

    @Test
    @DisplayName("Should throw exception when decrementing active bets for non-existent user")
    void should_ThrowException_When_DecrementingActiveBetsForNonExistentUser() {
        // When & Then
        assertThatThrownBy(() -> statisticsService.decrementActiveBets(NON_EXISTENT_USER_ID))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: " + NON_EXISTENT_USER_ID);
    }

    // ==================== getUserStatistics Tests ====================

    @Test
    @DisplayName("Should return comprehensive user statistics")
    void should_ReturnUserStatistics_When_ValidUserId() {
        // When
        UserStatistics stats = statisticsService.getUserStatistics(TEST_USER_ID);
        
        // Then
        assertThat(stats).isNotNull();
        assertThat(stats.winCount()).isEqualTo(testUser.getWinCount());
        assertThat(stats.lossCount()).isEqualTo(testUser.getLossCount());
        assertThat(stats.currentStreak()).isEqualTo(testUser.getCurrentStreak());
        assertThat(stats.longestStreak()).isEqualTo(testUser.getLongestStreak());
        assertThat(stats.activeBets()).isEqualTo(testUser.getActiveBets());
        assertThat(stats.winRate()).isEqualTo(testUser.getWinRate());
        assertThat(stats.totalGames()).isEqualTo(testUser.getTotalGames());
    }

    @Test
    @DisplayName("Should throw exception when getting statistics for non-existent user")
    void should_ThrowException_When_GettingStatisticsForNonExistentUser() {
        // When & Then
        assertThatThrownBy(() -> statisticsService.getUserStatistics(NON_EXISTENT_USER_ID))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: " + NON_EXISTENT_USER_ID);
    }

    // ==================== hasActivity Tests ====================

    @Test
    @DisplayName("Should return true when user has played games")
    void should_ReturnTrue_When_UserHasPlayedGames() {
        // When
        boolean result = statisticsService.hasActivity(TEST_USER_ID);
        
        // Then
        assertThat(result).isTrue(); // testUser has wins and losses
    }

    @Test
    @DisplayName("Should return true when user has active bets but no games played")
    void should_ReturnTrue_When_UserHasActiveBetsButNoGames() {
        // Given
        User userWithOnlyActiveBets = createTestUser(13L, 0, 0, 0, 0, 3);
        userService.addUser(userWithOnlyActiveBets);
        
        // When
        boolean result = statisticsService.hasActivity(13L);
        
        // Then
        assertThat(result).isTrue(); // Has active bets
    }

    @Test
    @DisplayName("Should return false when user has no activity")
    void should_ReturnFalse_When_UserHasNoActivity() {
        // When
        boolean result = statisticsService.hasActivity(newUser.getId());
        
        // Then
        assertThat(result).isFalse(); // newUser has no wins, losses, or active bets
    }

    // ==================== getPerformanceLevel Tests ====================

    @Test
    @DisplayName("Should return Rookie when total games less than 5")
    void should_ReturnRookie_When_TotalGamesLessThan5() {
        // Given
        User rookieUser = createTestUser(14L, 2, 1, 1, 1, 0); // Total: 3 games
        userService.addUser(rookieUser);
        
        // When
        String level = statisticsService.getPerformanceLevel(14L);
        
        // Then
        assertThat(level).isEqualTo("Rookie");
    }

    @Test
    @DisplayName("Should return Expert when win rate >= 0.7")
    void should_ReturnExpert_When_WinRateHighEnough() {
        // Given
        User expertUser = createTestUser(15L, 14, 1, 5, 8, 0); // Win rate: 14/15 = 0.93
        userService.addUser(expertUser);
        
        // When
        String level = statisticsService.getPerformanceLevel(15L);
        
        // Then
        assertThat(level).isEqualTo("Expert");
    }

    @Test
    @DisplayName("Should return Intermediate when win rate >= 0.5 and < 0.7")
    void should_ReturnIntermediate_When_WinRateModerate() {
        // Given
        User intermediateUser = createTestUser(16L, 6, 4, 2, 5, 0); // Win rate: 6/10 = 0.6
        userService.addUser(intermediateUser);
        
        // When
        String level = statisticsService.getPerformanceLevel(16L);
        
        // Then
        assertThat(level).isEqualTo("Intermediate");
    }

    @Test
    @DisplayName("Should return Beginner when win rate < 0.5")
    void should_ReturnBeginner_When_WinRateLow() {
        // Given
        User beginnerUser = createTestUser(17L, 3, 7, 0, 2, 0); // Win rate: 3/10 = 0.3
        userService.addUser(beginnerUser);
        
        // When
        String level = statisticsService.getPerformanceLevel(17L);
        
        // Then
        assertThat(level).isEqualTo("Beginner");
    }

    // ==================== isOnWinningStreak Tests ====================

    @Test
    @DisplayName("Should return true when user has positive current streak")
    void should_ReturnTrue_When_UserHasPositiveStreak() {
        // When
        boolean result = statisticsService.isOnWinningStreak(TEST_USER_ID);
        
        // Then
        assertThat(result).isTrue(); // testUser has current streak of 3
    }

    @Test
    @DisplayName("Should return false when user has zero current streak")
    void should_ReturnFalse_When_UserHasZeroStreak() {
        // When
        boolean result = statisticsService.isOnWinningStreak(newUser.getId());
        
        // Then
        assertThat(result).isFalse(); // newUser has current streak of 0
    }

    // ==================== resetStatistics Tests ====================

    @Test
    @DisplayName("Should reset all user statistics to zero")
    void should_ResetAllStatistics_When_ValidUserId() {
        // When
        statisticsService.resetStatistics(TEST_USER_ID);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getWinCount()).isZero();
        assertThat(updatedUser.getLossCount()).isZero();
        assertThat(updatedUser.getCurrentStreak()).isZero();
        assertThat(updatedUser.getLongestStreak()).isZero();
        assertThat(updatedUser.getActiveBets()).isZero();
    }

    @Test
    @DisplayName("Should throw exception when resetting statistics for non-existent user")
    void should_ThrowException_When_ResettingStatisticsForNonExistentUser() {
        // When & Then
        assertThatThrownBy(() -> statisticsService.resetStatistics(NON_EXISTENT_USER_ID))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: " + NON_EXISTENT_USER_ID);
    }

    // ==================== updateStatistics Tests ====================

    @Test
    @DisplayName("Should update only specified statistics fields")
    void should_UpdateSpecifiedFields_When_PartialUpdate() {
        // Given
        int originalWinCount = testUser.getWinCount();
        int originalLossCount = testUser.getLossCount();
        StatisticsUpdate partialUpdate = new StatisticsUpdate(20, null, 5, null, null);
        
        // When
        statisticsService.updateStatistics(TEST_USER_ID, partialUpdate);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getWinCount()).isEqualTo(20); // Updated
        assertThat(updatedUser.getLossCount()).isEqualTo(originalLossCount); // Unchanged
        assertThat(updatedUser.getCurrentStreak()).isEqualTo(5); // Updated
        assertThat(updatedUser.getLongestStreak()).isEqualTo(testUser.getLongestStreak()); // Unchanged
        assertThat(updatedUser.getActiveBets()).isEqualTo(testUser.getActiveBets()); // Unchanged
    }

    @Test
    @DisplayName("Should update all statistics fields when all provided")
    void should_UpdateAllFields_When_CompleteUpdate() {
        // Given
        StatisticsUpdate completeUpdate = new StatisticsUpdate(15, 8, 4, 12, 1);
        
        // When
        statisticsService.updateStatistics(TEST_USER_ID, completeUpdate);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getWinCount()).isEqualTo(15);
        assertThat(updatedUser.getLossCount()).isEqualTo(8);
        assertThat(updatedUser.getCurrentStreak()).isEqualTo(4);
        assertThat(updatedUser.getLongestStreak()).isEqualTo(12);
        assertThat(updatedUser.getActiveBets()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should not update any fields when all values are null")
    void should_NotUpdateAnyFields_When_AllValuesNull() {
        // Given
        int originalWinCount = testUser.getWinCount();
        int originalLossCount = testUser.getLossCount();
        int originalCurrentStreak = testUser.getCurrentStreak();
        int originalLongestStreak = testUser.getLongestStreak();
        int originalActiveBets = testUser.getActiveBets();
        
        StatisticsUpdate nullUpdate = new StatisticsUpdate(null, null, null, null, null);
        
        // When
        statisticsService.updateStatistics(TEST_USER_ID, nullUpdate);
        
        // Then
        User updatedUser = userService.getStoredUser(TEST_USER_ID);
        assertThat(updatedUser.getWinCount()).isEqualTo(originalWinCount);
        assertThat(updatedUser.getLossCount()).isEqualTo(originalLossCount);
        assertThat(updatedUser.getCurrentStreak()).isEqualTo(originalCurrentStreak);
        assertThat(updatedUser.getLongestStreak()).isEqualTo(originalLongestStreak);
        assertThat(updatedUser.getActiveBets()).isEqualTo(originalActiveBets);
    }

    @Test
    @DisplayName("Should throw exception when updating statistics for non-existent user")
    void should_ThrowException_When_UpdatingStatisticsForNonExistentUser() {
        // Given
        StatisticsUpdate update = new StatisticsUpdate(10, 5, 2, 8, 1);
        
        // When & Then
        assertThatThrownBy(() -> statisticsService.updateStatistics(NON_EXISTENT_USER_ID, update))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessageContaining("User not found: " + NON_EXISTENT_USER_ID);
    }

    // ==================== Edge Cases and Validation Tests ====================

    @Test
    @DisplayName("Should handle user with maximum integer statistics values")
    void should_HandleMaxValues_When_UserHasMaximumStats() {
        // Given
        User maxStatsUser = createTestUser(18L, Integer.MAX_VALUE - 1, 1000, 500, 800, 50);
        userService.addUser(maxStatsUser);
        
        // When
        statisticsService.recordWin(18L);
        
        // Then
        User updatedUser = userService.getStoredUser(18L);
        assertThat(updatedUser.getWinCount()).isEqualTo(Integer.MAX_VALUE); // Should increment without overflow
        assertThat(updatedUser.getCurrentStreak()).isEqualTo(501);
        assertThat(updatedUser.getLongestStreak()).isEqualTo(800); // Should remain unchanged as 501 < 800
    }

    @Test
    @DisplayName("Should maintain data consistency across multiple operations")
    void should_MaintainConsistency_When_MultipleOperations() {
        // Given
        User consistencyUser = createTestUser(19L, 5, 5, 2, 5, 3);
        userService.addUser(consistencyUser);
        
        // When - perform multiple operations
        statisticsService.recordWin(19L); // Should increment win count and streak
        statisticsService.incrementActiveBets(19L); // Should increment active bets
        statisticsService.recordLoss(19L); // Should increment loss count and reset streak
        statisticsService.decrementActiveBets(19L); // Should decrement active bets
        
        // Then
        User finalUser = userService.getStoredUser(19L);
        assertThat(finalUser.getWinCount()).isEqualTo(6); // 5 + 1
        assertThat(finalUser.getLossCount()).isEqualTo(6); // 5 + 1
        assertThat(finalUser.getCurrentStreak()).isZero(); // Reset by loss
        assertThat(finalUser.getLongestStreak()).isEqualTo(5); // Should remain unchanged
        assertThat(finalUser.getActiveBets()).isEqualTo(3); // 3 + 1 - 1 = 3
    }
}
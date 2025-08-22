package com.circlebet.service.user;

import com.circlebet.entity.user.User;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

/**
 * Service dedicated to user betting statistics and performance tracking.
 * Handles win/loss records, streaks, and betting analytics.
 */
@Service
@Validated
@Transactional
public class UserStatisticsService {

    private final UserService userService;

    @Autowired
    public UserStatisticsService(UserService userService) {
        this.userService = userService;
    }

    /**
     * Records a win for a user and updates statistics.
     */
    public void recordWin(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        
        user.setWinCount(user.getWinCount() + 1);
        user.setCurrentStreak(user.getCurrentStreak() + 1);
        
        // Update longest streak if current streak is higher
        if (user.getCurrentStreak() > user.getLongestStreak()) {
            user.setLongestStreak(user.getCurrentStreak());
        }
        
        userService.saveUser(user);
    }

    /**
     * Records a loss for a user and resets current streak.
     */
    public void recordLoss(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        
        user.setLossCount(user.getLossCount() + 1);
        user.setCurrentStreak(0); // Reset streak on loss
        
        userService.saveUser(user);
    }

    /**
     * Increments the active bets counter.
     */
    public void incrementActiveBets(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        user.setActiveBets(user.getActiveBets() + 1);
        userService.saveUser(user);
    }

    /**
     * Decrements the active bets counter.
     */
    public void decrementActiveBets(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        user.setActiveBets(Math.max(0, user.getActiveBets() - 1));
        userService.saveUser(user);
    }

    /**
     * Gets comprehensive user statistics.
     */
    @Transactional(readOnly = true)
    public UserStatistics getUserStatistics(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        
        return new UserStatistics(
            user.getWinCount(),
            user.getLossCount(),
            user.getCurrentStreak(),
            user.getLongestStreak(),
            user.getActiveBets(),
            user.getWinRate(),
            user.getTotalGames()
        );
    }

    /**
     * Resets user statistics (admin function).
     */
    public void resetStatistics(@NotNull Long userId) {
        User user = userService.getUserById(userId);
        
        user.setWinCount(0);
        user.setLossCount(0);
        user.setCurrentStreak(0);
        user.setLongestStreak(0);
        user.setActiveBets(0);
        
        userService.saveUser(user);
    }

    /**
     * Bulk updates statistics (for data migration or corrections).
     */
    public void updateStatistics(@NotNull Long userId, @NotNull StatisticsUpdate update) {
        User user = userService.getUserById(userId);
        
        if (update.winCount() != null) {
            user.setWinCount(update.winCount());
        }
        if (update.lossCount() != null) {
            user.setLossCount(update.lossCount());
        }
        if (update.currentStreak() != null) {
            user.setCurrentStreak(update.currentStreak());
        }
        if (update.longestStreak() != null) {
            user.setLongestStreak(update.longestStreak());
        }
        if (update.activeBets() != null) {
            user.setActiveBets(update.activeBets());
        }
        
        userService.saveUser(user);
    }

    // DTO for user statistics
    public record UserStatistics(
        int winCount,
        int lossCount,
        int currentStreak,
        int longestStreak,
        int activeBets,
        double winRate,
        int totalGames
    ) {}

    // DTO for statistics updates
    public record StatisticsUpdate(
        Integer winCount,
        Integer lossCount,
        Integer currentStreak,
        Integer longestStreak,
        Integer activeBets
    ) {}
}
package com.betmate.service.user;

import com.betmate.entity.user.User;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Service for managing daily login rewards.
 * Handles checking eligibility and awarding daily login credits to users.
 */
@Service
@Validated
public class DailyLoginRewardService {

    private static final Logger log = LoggerFactory.getLogger(DailyLoginRewardService.class);
    private static final BigDecimal DAILY_REWARD_AMOUNT = new BigDecimal("10");
    private static final int MINUTES_BETWEEN_REWARDS = 24 * 60; // 1440 minutes = 24 hours

    private final UserService userService;
    private final UserCreditService userCreditService;

    @Autowired
    public DailyLoginRewardService(UserService userService, UserCreditService userCreditService) {
        this.userService = userService;
        this.userCreditService = userCreditService;
    }

    /**
     * Checks if user is eligible for daily reward and awards it if eligible.
     * Awards 10 credits if 24 hours (1440 minutes) have passed since last claim.
     * Uses minute-level precision to ensure exactly 24 hours, not just 24 complete hour blocks.
     *
     * @param user The user to check and award
     * @return DailyRewardResult containing whether reward was awarded and details
     */
    @Transactional
    public DailyRewardResult checkAndAwardDailyReward(@NotNull User user) {
        String correlationId = UUID.randomUUID().toString();
        log.info("=== DAILY REWARD CHECK START === User: {}, CorrelationId: {}", user.getId(), correlationId);
        log.info("Input user state - User: {}, LastDailyRewardClaimedAt: {}", user.getId(), user.getLastDailyRewardClaimedAt());

        // Refetch user to ensure we have latest data
        log.info("Refetching user from database - User: {}", user.getId());
        User freshUser = userService.getUserById(user.getId());
        log.info("Fresh user fetched - User: {}, LastDailyRewardClaimedAt: {}, CreditBalance: {}",
            freshUser.getId(), freshUser.getLastDailyRewardClaimedAt(), freshUser.getCreditBalance());

        boolean isAvailable = isDailyRewardAvailable(freshUser);
        log.info("Daily reward availability check - User: {}, IsAvailable: {}, LastClaimed: {}",
            freshUser.getId(), isAvailable, freshUser.getLastDailyRewardClaimedAt());

        if (!isAvailable) {
            log.info("=== DAILY REWARD NOT AVAILABLE === User: {}, LastClaimed: {}, CorrelationId: {}",
                freshUser.getId(), freshUser.getLastDailyRewardClaimedAt(), correlationId);
            return new DailyRewardResult(false, null, freshUser.getLastDailyRewardClaimedAt());
        }

        // Award credits
        log.info("=== AWARDING DAILY LOGIN REWARD === User: {}, Amount: {}, CurrentBalance: {}, CorrelationId: {}",
            freshUser.getId(), DAILY_REWARD_AMOUNT, freshUser.getCreditBalance(), correlationId);

        try {
            log.info("Calling userCreditService.addCredits - User: {}, Amount: {}", freshUser.getId(), DAILY_REWARD_AMOUNT);
            User updatedUser = userCreditService.addCredits(
                freshUser.getId(),
                DAILY_REWARD_AMOUNT,
                "Daily login bonus"
            );
            log.info("Credits added successfully - User: {}, NewBalance: {}", updatedUser.getId(), updatedUser.getCreditBalance());

            // Update last claimed timestamp
            LocalDateTime now = LocalDateTime.now();
            log.info("Setting lastDailyRewardClaimedAt - User: {}, Timestamp: {}", updatedUser.getId(), now);
            updatedUser.setLastDailyRewardClaimedAt(now);
            updatedUser = userService.saveUser(updatedUser);
            log.info("User saved with new lastDailyRewardClaimedAt - User: {}, Timestamp: {}", updatedUser.getId(), updatedUser.getLastDailyRewardClaimedAt());

            log.info("=== DAILY LOGIN REWARD AWARDED SUCCESSFULLY === User: {}, Amount: {}, NewBalance: {}, ClaimedAt: {}, CorrelationId: {}",
                updatedUser.getId(), DAILY_REWARD_AMOUNT, updatedUser.getCreditBalance(), now, correlationId);

            return new DailyRewardResult(true, DAILY_REWARD_AMOUNT, now);
        } catch (Exception e) {
            log.error("=== ERROR AWARDING DAILY REWARD === User: {}, Error: {}, CorrelationId: {}",
                freshUser.getId(), e.getMessage(), correlationId, e);
            throw e;
        }
    }

    /**
     * Checks if user is eligible to claim daily reward.
     * Eligible if never claimed before OR 1440+ minutes (24 hours) since last claim.
     * Uses minute-level precision for accurate 24-hour calculation.
     *
     * @param user The user to check
     * @return true if eligible, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isDailyRewardAvailable(@NotNull User user) {
        LocalDateTime lastClaimed = user.getLastDailyRewardClaimedAt();
        log.info("=== CHECKING REWARD AVAILABILITY === User: {}, LastClaimed: {}", user.getId(), lastClaimed);

        // Never claimed before - eligible
        if (lastClaimed == null) {
            log.info("User {} has NEVER claimed daily reward - ELIGIBLE", user.getId());
            return true;
        }

        // Check if 24+ hours have passed (using minutes for precise calculation)
        LocalDateTime now = LocalDateTime.now();
        long minutesSinceLastClaim = ChronoUnit.MINUTES.between(lastClaimed, now);
        boolean isAvailable = minutesSinceLastClaim >= MINUTES_BETWEEN_REWARDS;

        log.info("Daily reward availability check - User: {}, LastClaimed: {}, Now: {}, MinutesSince: {}, Required: {} ({} hours), Available: {}",
            user.getId(), lastClaimed, now, minutesSinceLastClaim, MINUTES_BETWEEN_REWARDS, MINUTES_BETWEEN_REWARDS / 60, isAvailable);

        return isAvailable;
    }

    /**
     * Gets the next available time for daily reward claim.
     *
     * @param user The user to check
     * @return LocalDateTime of next available claim, or null if available now
     */
    @Transactional(readOnly = true)
    public LocalDateTime getNextAvailableTime(@NotNull User user) {
        // Refetch to ensure fresh data
        User freshUser = userService.getUserById(user.getId());
        if (isDailyRewardAvailable(freshUser)) {
            return null; // Available now
        }

        LocalDateTime lastClaimed = freshUser.getLastDailyRewardClaimedAt();
        return lastClaimed.plusMinutes(MINUTES_BETWEEN_REWARDS);
    }

    /**
     * Gets comprehensive daily reward status for a user.
     *
     * @param user The user to check
     * @return DailyRewardStatus containing all relevant information
     */
    @Transactional(readOnly = true)
    public DailyRewardStatus getDailyRewardStatus(@NotNull User user) {
        // Refetch to ensure fresh data
        User freshUser = userService.getUserById(user.getId());
        boolean canClaim = isDailyRewardAvailable(freshUser);
        LocalDateTime lastClaimed = freshUser.getLastDailyRewardClaimedAt();
        LocalDateTime nextAvailable = canClaim ? null : getNextAvailableTime(freshUser);

        return new DailyRewardStatus(canClaim, lastClaimed, nextAvailable, DAILY_REWARD_AMOUNT);
    }

    // ==========================================
    // DTOs
    // ==========================================

    /**
     * Result of a daily reward check and award operation.
     */
    public record DailyRewardResult(
        boolean wasAwarded,
        BigDecimal amountAwarded,
        LocalDateTime claimedAt
    ) {}

    /**
     * Comprehensive status of daily reward for a user.
     */
    public record DailyRewardStatus(
        boolean canClaim,
        LocalDateTime lastClaimedAt,
        LocalDateTime nextAvailableAt,
        BigDecimal rewardAmount
    ) {}
}

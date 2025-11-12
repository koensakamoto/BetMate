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
    private final ActiveEffectsService activeEffectsService;

    @Autowired
    public DailyLoginRewardService(UserService userService,
                                  UserCreditService userCreditService,
                                  ActiveEffectsService activeEffectsService) {
        this.userService = userService;
        this.userCreditService = userCreditService;
        this.activeEffectsService = activeEffectsService;
    }

    /**
     * Checks if user is eligible for daily reward and awards it if eligible.
     * Awards 10 credits (or 20 if user has an active daily bonus doubler) if 24 hours (1440 minutes)
     * have passed since last claim. Uses minute-level precision to ensure exactly 24 hours,
     * not just 24 complete hour blocks.
     * If a doubler is used, consumes one use from the active doubler.
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

        // Check for active daily bonus doubler
        boolean hasActiveDoubler = activeEffectsService.hasActiveDailyDoubler(freshUser);
        BigDecimal rewardAmount = hasActiveDoubler ? DAILY_REWARD_AMOUNT.multiply(new BigDecimal("2")) : DAILY_REWARD_AMOUNT;

        log.info("=== AWARDING DAILY LOGIN REWARD === User: {}, BaseAmount: {}, HasDoubler: {}, FinalAmount: {}, CurrentBalance: {}, CorrelationId: {}",
            freshUser.getId(), DAILY_REWARD_AMOUNT, hasActiveDoubler, rewardAmount, freshUser.getCreditBalance(), correlationId);

        try {
            // Award credits
            log.info("Calling userCreditService.addCredits - User: {}, Amount: {}", freshUser.getId(), rewardAmount);
            String creditReason = hasActiveDoubler ? "Daily login bonus (2x doubled!)" : "Daily login bonus";
            User updatedUser = userCreditService.addCredits(
                freshUser.getId(),
                rewardAmount,
                creditReason
            );
            log.info("Credits added successfully - User: {}, NewBalance: {}", updatedUser.getId(), updatedUser.getCreditBalance());

            // Consume doubler use if it was applied
            if (hasActiveDoubler) {
                boolean consumed = activeEffectsService.consumeDoublerUse(updatedUser);
                log.info("Daily bonus doubler consumed - User: {}, Success: {}", updatedUser.getId(), consumed);
            }

            // Update last claimed timestamp
            LocalDateTime now = LocalDateTime.now();
            log.info("Setting lastDailyRewardClaimedAt - User: {}, Timestamp: {}", updatedUser.getId(), now);
            updatedUser.setLastDailyRewardClaimedAt(now);
            updatedUser = userService.saveUser(updatedUser);
            log.info("User saved with new lastDailyRewardClaimedAt - User: {}, Timestamp: {}", updatedUser.getId(), updatedUser.getLastDailyRewardClaimedAt());

            log.info("=== DAILY LOGIN REWARD AWARDED SUCCESSFULLY === User: {}, Amount: {}, Doubled: {}, NewBalance: {}, ClaimedAt: {}, CorrelationId: {}",
                updatedUser.getId(), rewardAmount, hasActiveDoubler, updatedUser.getCreditBalance(), now, correlationId);

            return new DailyRewardResult(true, rewardAmount, now);
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

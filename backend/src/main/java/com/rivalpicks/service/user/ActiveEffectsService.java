package com.rivalpicks.service.user;

import com.rivalpicks.entity.user.User;
import com.rivalpicks.entity.user.UserInventory;
import com.rivalpicks.entity.store.StoreItem;
import com.rivalpicks.repository.user.UserInventoryRepository;
import com.rivalpicks.service.bet.InsuranceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing active effects from consumable items (boosters, insurance, etc.).
 * Handles activation, consumption, and checking of active item effects.
 */
@Service
public class ActiveEffectsService {

    private static final Logger logger = LoggerFactory.getLogger(ActiveEffectsService.class);

    private final UserInventoryRepository userInventoryRepository;
    private final InsuranceService insuranceService;

    @Autowired
    public ActiveEffectsService(UserInventoryRepository userInventoryRepository,
                               @Lazy InsuranceService insuranceService) {
        this.userInventoryRepository = userInventoryRepository;
        this.insuranceService = insuranceService;
    }

    /**
     * Checks if user has an active daily bonus doubler.
     *
     * @param user the user to check
     * @return true if user has an active daily doubler with remaining uses
     */
    public boolean hasActiveDailyDoubler(User user) {
        var activeDoubler = getActiveDailyDoubler(user);
        return activeDoubler != null && activeDoubler.isActiveBooster();
    }

    /**
     * Gets the active daily bonus doubler for a user, if any.
     *
     * @param user the user to check
     * @return active UserInventory item or null if none found
     */
    public UserInventory getActiveDailyDoubler(User user) {
        var doublers = userInventoryRepository.findByUserAndIsActiveTrueAndStoreItem_ItemType(
            user,
            StoreItem.ItemType.DAILY_BOOSTER
        );

        // Return first active doubler with remaining uses
        return doublers.stream()
            .filter(UserInventory::isActiveBooster)
            .findFirst()
            .orElse(null);
    }

    /**
     * Records that the user has used their active daily doubler.
     * For time-based doublers, this just updates the lastUsedAt timestamp.
     *
     * @param user the user whose doubler to record usage for
     * @return true if usage was successfully recorded
     */
    @Transactional
    public boolean consumeDoublerUse(User user) {
        var activeDoubler = getActiveDailyDoubler(user);

        if (activeDoubler == null || !activeDoubler.isActiveBooster()) {
            logger.warn("Attempted to use doubler for user {} but no active doubler found",
                user.getId());
            return false;
        }

        logger.info("Recording daily doubler usage for user {}. Expires at: {}",
            user.getId(), activeDoubler.getExpiresAt());

        // Just update last used timestamp (time-based booster doesn't decrement uses)
        activeDoubler.setLastUsedAt(java.time.LocalDateTime.now());
        userInventoryRepository.save(activeDoubler);

        logger.info("Daily doubler usage recorded");

        return true;
    }

    /**
     * Activates a daily bonus doubler item for a user.
     * Sets the item as active for 14 days (time-based).
     *
     * @param user the user activating the doubler
     * @param doublerItem the inventory item to activate
     */
    @Transactional
    public void activateDailyDoubler(User user, UserInventory doublerItem) {
        if (doublerItem.getStoreItem().getItemType() != StoreItem.ItemType.DAILY_BOOSTER) {
            throw new IllegalArgumentException("Can only activate DAILY_BOOSTER items");
        }

        logger.info("Activating daily bonus doubler for user {}", user.getId());

        // Activate for 14 days (time-based, not use-based)
        doublerItem.activateBoosterForDuration(14);
        userInventoryRepository.save(doublerItem);

        logger.info("Daily bonus doubler activated until {}", doublerItem.getExpiresAt());
    }

    /**
     * Gets the remaining days on user's active daily doubler.
     *
     * @param user the user to check
     * @return number of remaining days (rounded up), or 0 if no active doubler
     */
    public int getDoublerDaysRemaining(User user) {
        var activeDoubler = getActiveDailyDoubler(user);
        if (activeDoubler == null || activeDoubler.getExpiresAt() == null) {
            return 0;
        }

        var now = java.time.LocalDateTime.now();
        var expiresAt = activeDoubler.getExpiresAt();

        if (expiresAt.isBefore(now)) {
            return 0;
        }

        // Calculate days remaining (rounded up)
        long hoursRemaining = java.time.Duration.between(now, expiresAt).toHours();
        return (int) Math.ceil(hoursRemaining / 24.0);
    }

    /**
     * Gets the remaining uses on user's active daily doubler.
     * For backward compatibility with time-based doublers, returns days remaining.
     *
     * @param user the user to check
     * @return number of remaining days (for time-based) or uses (for use-based), or 0 if no active doubler
     * @deprecated Use getDoublerDaysRemaining() instead for clarity
     */
    @Deprecated
    public int getDoublerUsesRemaining(User user) {
        var activeDoubler = getActiveDailyDoubler(user);
        if (activeDoubler == null) {
            return 0;
        }

        // If uses-based, return uses
        if (activeDoubler.getUsesRemaining() != null) {
            return activeDoubler.getUsesRemaining();
        }

        // If time-based, return days
        return getDoublerDaysRemaining(user);
    }

    // ==========================================
    // INSURANCE EFFECTS
    // ==========================================

    /**
     * Checks if user has any active insurance items.
     * Delegates to InsuranceService for the actual logic.
     *
     * @param user the user to check
     * @return true if user has at least one unused insurance item
     */
    public boolean hasActiveInsurance(User user) {
        return insuranceService.hasActiveInsurance(user);
    }

    /**
     * Gets all active insurance items for a user.
     * Delegates to InsuranceService.
     *
     * @param user the user to check
     * @return list of active insurance items
     */
    public List<UserInventory> getActiveInsuranceItems(User user) {
        return insuranceService.getAllActiveInsuranceItems(user);
    }

    /**
     * Gets active insurance items of a specific tier.
     * Delegates to InsuranceService.
     *
     * @param user the user to check
     * @param tier the tier name (e.g., "BASIC", "PREMIUM", "ELITE")
     * @return list of active insurance items of the specified tier
     */
    public List<UserInventory> getActiveInsuranceByTier(User user, String tier) {
        return insuranceService.getActiveInsuranceByTier(user, tier);
    }

    /**
     * Gets the total number of insurance uses remaining across all tiers.
     * Delegates to InsuranceService.
     *
     * @param user the user to check
     * @return total uses remaining
     */
    public int getTotalInsuranceUsesRemaining(User user) {
        return insuranceService.getTotalInsuranceUsesRemaining(user);
    }

    /**
     * Gets count of active insurance items by tier.
     * Delegates to InsuranceService.
     *
     * @param user the user to check
     * @param tier the tier name (e.g., "BASIC", "PREMIUM", "ELITE")
     * @return count of active insurance items
     */
    public long getActiveInsuranceCountByTier(User user, String tier) {
        return insuranceService.getActiveInsuranceCountByTier(user, tier);
    }
}

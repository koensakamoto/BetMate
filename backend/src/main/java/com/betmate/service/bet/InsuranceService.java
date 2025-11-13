package com.betmate.service.bet;

import com.betmate.dto.betting.response.EligibleBetResponseDto;
import com.betmate.entity.betting.Bet;
import com.betmate.entity.betting.BetParticipation;
import com.betmate.entity.store.StoreItem;
import com.betmate.entity.user.User;
import com.betmate.entity.user.UserInventory;
import com.betmate.repository.betting.BetParticipationRepository;
import com.betmate.repository.user.UserInventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing bet insurance functionality.
 * Handles insurance application, validation, consumption, and refund calculations.
 */
@Service
public class InsuranceService {

    private static final Logger logger = LoggerFactory.getLogger(InsuranceService.class);

    private final UserInventoryRepository userInventoryRepository;
    private final BetParticipationRepository betParticipationRepository;

    // Insurance tier mappings
    private static final String BASIC_INSURANCE = "Basic Bet Insurance";
    private static final String PREMIUM_INSURANCE = "Premium Bet Insurance";
    private static final String ELITE_INSURANCE = "Elite Bet Insurance";
    private static final int BASIC_REFUND_PERCENTAGE = 25;
    private static final int PREMIUM_REFUND_PERCENTAGE = 50;
    private static final int ELITE_REFUND_PERCENTAGE = 75;

    public InsuranceService(UserInventoryRepository userInventoryRepository,
                          BetParticipationRepository betParticipationRepository) {
        this.userInventoryRepository = userInventoryRepository;
        this.betParticipationRepository = betParticipationRepository;
    }

    /**
     * Checks if user has any active (unused) insurance items.
     *
     * @param user the user to check
     * @return true if user has at least one unused insurance item
     */
    public boolean hasActiveInsurance(User user) {
        List<UserInventory> insuranceItems = getAllActiveInsuranceItems(user);
        return !insuranceItems.isEmpty();
    }

    /**
     * Gets all active insurance items for a user.
     * Active means: isActive=true AND usesRemaining > 0.
     *
     * @param user the user to check
     * @return list of active insurance items
     */
    public List<UserInventory> getAllActiveInsuranceItems(User user) {
        // Get all insurance items (BASIC_INSURANCE, PREMIUM_INSURANCE, ELITE_INSURANCE)
        List<UserInventory> allInsurance = userInventoryRepository
            .findByUserAndIsActiveTrueAndStoreItem_ItemType(user, StoreItem.ItemType.BASIC_INSURANCE);

        List<UserInventory> premiumInsurance = userInventoryRepository
            .findByUserAndIsActiveTrueAndStoreItem_ItemType(user, StoreItem.ItemType.PREMIUM_INSURANCE);

        List<UserInventory> eliteInsurance = userInventoryRepository
            .findByUserAndIsActiveTrueAndStoreItem_ItemType(user, StoreItem.ItemType.ELITE_INSURANCE);

        // Combine all insurance types
        allInsurance.addAll(premiumInsurance);
        allInsurance.addAll(eliteInsurance);

        // Filter to only include items with uses remaining
        return allInsurance.stream()
            .filter(item -> item.getUsesRemaining() != null && item.getUsesRemaining() > 0)
            .toList();
    }

    /**
     * Gets a specific active insurance item by inventory ID.
     *
     * @param user the user who owns the insurance
     * @param insuranceItemId the inventory item ID
     * @return the insurance item if found and active
     */
    public Optional<UserInventory> getActiveInsuranceById(User user, Long insuranceItemId) {
        return userInventoryRepository.findById(insuranceItemId)
            .filter(item -> item.getUser().getId().equals(user.getId()))
            .filter(item -> item.getIsActive())
            .filter(item -> isInsuranceItem(item))
            .filter(item -> item.getUsesRemaining() != null && item.getUsesRemaining() > 0);
    }

    /**
     * Gets active insurance items of a specific tier.
     *
     * @param user the user to check
     * @param tier the tier name (e.g., "BASIC", "PREMIUM", "ELITE")
     * @return list of active insurance items of the specified tier
     */
    public List<UserInventory> getActiveInsuranceByTier(User user, String tier) {
        StoreItem.ItemType itemType = switch (tier.toUpperCase()) {
            case "BASIC" -> StoreItem.ItemType.BASIC_INSURANCE;
            case "PREMIUM" -> StoreItem.ItemType.PREMIUM_INSURANCE;
            case "ELITE" -> StoreItem.ItemType.ELITE_INSURANCE;
            default -> throw new IllegalArgumentException("Invalid insurance tier: " + tier);
        };

        return userInventoryRepository
            .findByUserAndIsActiveTrueAndStoreItem_ItemType(user, itemType)
            .stream()
            .filter(item -> item.getUsesRemaining() != null && item.getUsesRemaining() > 0)
            .toList();
    }

    /**
     * Applies insurance to a bet participation.
     * This must be called BEFORE the bet closes.
     *
     * @param user the user applying insurance
     * @param participation the bet participation to insure
     * @param insuranceItemId the inventory item ID of the insurance to use
     * @throws IllegalArgumentException if validation fails
     */
    @Transactional
    public void applyInsuranceToBet(User user, BetParticipation participation, Long insuranceItemId) {
        // Validate ownership
        if (!participation.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("User does not own this participation");
        }

        // Get insurance item
        UserInventory insurance = getActiveInsuranceById(user, insuranceItemId)
            .orElseThrow(() -> new IllegalArgumentException("Insurance item not found or not available"));

        // Validate insurance can be applied
        validateInsuranceApplication(participation, insurance);

        // Calculate refund percentage based on insurance tier
        Integer refundPercentage = getRefundPercentage(insurance.getStoreItem().getItemType());

        // Apply insurance to participation
        participation.applyInsurance(insurance, refundPercentage);
        betParticipationRepository.save(participation);

        // Consume one use of the insurance
        consumeInsurance(insurance);

        logger.info("Applied {} insurance to bet participation {} for user {}. Refund percentage: {}%",
            insurance.getStoreItem().getName(), participation.getId(), user.getId(), refundPercentage);
    }

    /**
     * Validates that insurance can be applied to a participation.
     *
     * @param participation the bet participation
     * @param insurance the insurance item
     * @throws IllegalArgumentException if validation fails
     */
    public void validateInsuranceApplication(BetParticipation participation, UserInventory insurance) {
        // Cannot apply insurance if bet is closed or resolved
        Bet bet = participation.getBet();
        if (!bet.isOpenForBetting()) {
            throw new IllegalArgumentException("Cannot apply insurance after bet closes");
        }

        // Cannot apply insurance if participation already has insurance
        if (participation.hasInsurance()) {
            throw new IllegalArgumentException("This participation already has insurance applied");
        }

        // Participation must be active
        if (participation.getStatus() != BetParticipation.ParticipationStatus.ACTIVE) {
            throw new IllegalArgumentException("Can only apply insurance to active participations");
        }

        // Insurance must be an insurance item type
        if (!isInsuranceItem(insurance)) {
            throw new IllegalArgumentException("Item is not an insurance type");
        }

        // Insurance must have uses remaining
        if (insurance.getUsesRemaining() == null || insurance.getUsesRemaining() <= 0) {
            throw new IllegalArgumentException("Insurance has no uses remaining");
        }
    }

    /**
     * Consumes one use of an insurance item.
     *
     * @param insurance the insurance item to consume
     */
    @Transactional
    public void consumeInsurance(UserInventory insurance) {
        if (insurance.getUsesRemaining() == null || insurance.getUsesRemaining() <= 0) {
            throw new IllegalStateException("Cannot consume insurance with no uses remaining");
        }

        // Decrement uses
        insurance.setUsesRemaining(insurance.getUsesRemaining() - 1);
        insurance.setLastUsedAt(LocalDateTime.now());

        // If no uses remain, deactivate
        if (insurance.getUsesRemaining() == 0) {
            insurance.setIsActive(false);
            logger.info("Insurance item {} fully consumed and deactivated", insurance.getId());
        }

        userInventoryRepository.save(insurance);
        logger.info("Consumed insurance use. Remaining uses: {}", insurance.getUsesRemaining());
    }

    /**
     * Calculates the insurance refund amount.
     *
     * @param betAmount the original bet amount
     * @param refundPercentage the refund percentage (25, 50, or 75)
     * @return the calculated refund amount
     */
    public BigDecimal calculateRefundAmount(BigDecimal betAmount, Integer refundPercentage) {
        if (betAmount == null || betAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        if (refundPercentage == null || refundPercentage <= 0) {
            return BigDecimal.ZERO;
        }

        return betAmount.multiply(BigDecimal.valueOf(refundPercentage))
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /**
     * Gets the refund percentage for an insurance tier.
     *
     * @param itemType the insurance item type
     * @return the refund percentage (25, 50, or 75)
     */
    public Integer getRefundPercentage(StoreItem.ItemType itemType) {
        return switch (itemType) {
            case BASIC_INSURANCE -> BASIC_REFUND_PERCENTAGE;
            case PREMIUM_INSURANCE -> PREMIUM_REFUND_PERCENTAGE;
            case ELITE_INSURANCE -> ELITE_REFUND_PERCENTAGE;
            default -> throw new IllegalArgumentException("Not an insurance item type: " + itemType);
        };
    }

    /**
     * Checks if an inventory item is an insurance type.
     *
     * @param item the inventory item
     * @return true if item is insurance
     */
    public boolean isInsuranceItem(UserInventory item) {
        if (item == null || item.getStoreItem() == null) {
            return false;
        }
        StoreItem.ItemType itemType = item.getStoreItem().getItemType();
        return itemType == StoreItem.ItemType.BASIC_INSURANCE ||
               itemType == StoreItem.ItemType.PREMIUM_INSURANCE ||
               itemType == StoreItem.ItemType.ELITE_INSURANCE;
    }

    /**
     * Gets the insurance tier name from an item type.
     *
     * @param itemType the insurance item type
     * @return the tier name (BASIC, PREMIUM, or ELITE)
     */
    public String getInsuranceTierName(StoreItem.ItemType itemType) {
        return switch (itemType) {
            case BASIC_INSURANCE -> "BASIC";
            case PREMIUM_INSURANCE -> "PREMIUM";
            case ELITE_INSURANCE -> "ELITE";
            default -> throw new IllegalArgumentException("Not an insurance item type: " + itemType);
        };
    }

    /**
     * Removes insurance from a participation (used when bet is cancelled).
     * Returns the consumed insurance use back to the user.
     *
     * @param participation the participation to remove insurance from
     */
    @Transactional
    public void removeInsuranceAndRefund(BetParticipation participation) {
        if (!participation.hasInsurance()) {
            return; // Nothing to remove
        }

        UserInventory insurance = participation.getInsuranceItem();

        // Restore the consumed use
        if (insurance != null && insurance.getUsesRemaining() != null) {
            insurance.setUsesRemaining(insurance.getUsesRemaining() + 1);
            insurance.setIsActive(true); // Reactivate if it was deactivated
            userInventoryRepository.save(insurance);
            logger.info("Refunded insurance use back to item {}. New uses remaining: {}",
                insurance.getId(), insurance.getUsesRemaining());
        }

        // Remove insurance from participation
        participation.removeInsurance();
        betParticipationRepository.save(participation);

        logger.info("Removed insurance from participation {}", participation.getId());
    }

    /**
     * Gets count of active insurance items by tier.
     *
     * @param user the user to check
     * @param tier the tier name (e.g., "BASIC", "PREMIUM", "ELITE")
     * @return count of active insurance items
     */
    public long getActiveInsuranceCountByTier(User user, String tier) {
        return getActiveInsuranceByTier(user, tier).size();
    }

    /**
     * Gets total uses remaining across all insurance items.
     *
     * @param user the user to check
     * @return total uses remaining
     */
    public int getTotalInsuranceUsesRemaining(User user) {
        List<UserInventory> allInsurance = getAllActiveInsuranceItems(user);
        return allInsurance.stream()
            .mapToInt(item -> item.getUsesRemaining() != null ? item.getUsesRemaining() : 0)
            .sum();
    }

    /**
     * Gets all bets eligible for insurance application for a user.
     * Eligible bets are those that:
     * - User is participating in
     * - Are OPEN for betting (before deadline)
     * - Don't already have insurance applied
     * - Participation is ACTIVE
     *
     * @param user the user to check
     * @return list of eligible bet DTOs
     */
    public List<EligibleBetResponseDto> getEligibleBetsForInsurance(User user) {
        // Get all user's bet participations
        List<BetParticipation> allParticipations = betParticipationRepository.findByUser(user);

        logger.info("Found {} total participations for user {}", allParticipations.size(), user.getId());

        // Filter and convert to DTOs
        List<EligibleBetResponseDto> eligibleBets = allParticipations.stream()
            .map(participation -> {
                Bet bet = participation.getBet();
                boolean canApply = true;
                String reason = null;

                // Check if bet is open for betting
                if (!bet.isOpenForBetting()) {
                    canApply = false;
                    reason = "Bet is closed for betting";
                }
                // Check if participation already has insurance
                else if (participation.hasInsurance()) {
                    canApply = false;
                    reason = "Insurance already applied";
                }
                // Check if participation is active
                else if (participation.getStatus() != BetParticipation.ParticipationStatus.ACTIVE) {
                    canApply = false;
                    reason = "Participation is not active";
                }

                // Convert to DTO
                return EligibleBetResponseDto.fromParticipation(participation, canApply, reason);
            })
            .collect(Collectors.toList());

        // Log summary
        long eligibleCount = eligibleBets.stream().filter(EligibleBetResponseDto::isCanApply).count();
        logger.info("Found {} eligible bets for insurance out of {} total participations for user {}",
            eligibleCount, allParticipations.size(), user.getId());

        return eligibleBets;
    }
}

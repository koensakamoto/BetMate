package com.betmate.config;

import com.betmate.entity.store.StoreItem;
import com.betmate.repository.store.StoreItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Initializes the store with default items.
 */
@Configuration
public class StoreDataInitializer {

    @Autowired
    private StoreItemRepository storeItemRepository;

    @Bean
    @Transactional
    public CommandLineRunner initializeStoreItems() {
        return args -> {
            // Only populate if store is empty
            if (storeItemRepository.count() > 0) {
                System.out.println("Store items already exist, skipping initialization");
                return;
            }

            System.out.println("Initializing store items...");

            // Featured Items
            createItem("Diamond Hands", "1.5x payout on ALL bets for 24 hours. Stacks with other bonuses. Active immediately.",
                    new BigDecimal("400"), "diamond", StoreItem.ItemType.MULTIPLIER,
                    StoreItem.ItemCategory.MULTIPLIERS, StoreItem.Rarity.LEGENDARY, true, true, 1);

            createItem("Sure Shot", "Place a bet with ZERO risk. Win = full payout, Lose = stake refunded. One-time use.",
                    new BigDecimal("400"), "gps-fixed", StoreItem.ItemType.SURE_SHOT,
                    StoreItem.ItemCategory.BETTING_TOOLS, StoreItem.Rarity.LEGENDARY, true, true, 2);

            createItem("Triple Threat", "3x payout on your next winning bet. Cannot stack with other multipliers. One-time use.",
                    new BigDecimal("600"), "looks-3", StoreItem.ItemType.MULTIPLIER,
                    StoreItem.ItemCategory.MULTIPLIERS, StoreItem.Rarity.LEGENDARY, true, true, 3);

            createItem("VIP Pass (30 Days)", "10% discount on all bet stakes for 30 days. Full payouts on wins. Stackable with other discounts.",
                    new BigDecimal("1000"), "card-membership", StoreItem.ItemType.VIP_PASS,
                    StoreItem.ItemCategory.DISCOUNTS, StoreItem.Rarity.LEGENDARY, true, true, 4);

            // Risk Management Items
            createItem("Bet Insurance (Basic)", "Get 25% of stake back if you lose. One-time use. Must activate before bet closes.",
                    new BigDecimal("100"), "shield", StoreItem.ItemType.BET_INSURANCE,
                    StoreItem.ItemCategory.RISK_MANAGEMENT, StoreItem.Rarity.UNCOMMON, true, false, 1);

            createItem("Bet Insurance (Premium)", "Get 50% of stake back if you lose. One-time use. Must activate before bet closes.",
                    new BigDecimal("200"), "shield", StoreItem.ItemType.BET_INSURANCE,
                    StoreItem.ItemCategory.RISK_MANAGEMENT, StoreItem.Rarity.RARE, true, false, 2);

            createItem("Freeze Card", "Pause a bet and withdraw your stake. Must use within 1 hour of placing bet. Forfeit 10% fee.",
                    new BigDecimal("175"), "pause-circle-outline", StoreItem.ItemType.FREEZE_CARD,
                    StoreItem.ItemCategory.RISK_MANAGEMENT, StoreItem.Rarity.RARE, true, false, 3);

            createItem("Hedge Helper", "Place a counter-bet at 50% off stake. Guarantee some return regardless of outcome. One-time use.",
                    new BigDecimal("200"), "security", StoreItem.ItemType.HEDGE_HELPER,
                    StoreItem.ItemCategory.RISK_MANAGEMENT, StoreItem.Rarity.RARE, true, false, 4);

            createItem("Mulligan Token", "Change your bet choice AFTER deadline. Must use before bet is resolved. One-time use.",
                    new BigDecimal("300"), "refresh", StoreItem.ItemType.MULLIGAN_TOKEN,
                    StoreItem.ItemCategory.RISK_MANAGEMENT, StoreItem.Rarity.EPIC, true, false, 5);

            createItem("Bet Insurance (Elite)", "Get 75% of stake back if you lose. One-time use. Must activate before bet closes.",
                    new BigDecimal("350"), "shield", StoreItem.ItemType.BET_INSURANCE,
                    StoreItem.ItemCategory.RISK_MANAGEMENT, StoreItem.Rarity.EPIC, true, false, 6);

            // Multipliers
            createItem("Credit Booster", "Earn 25% more credits from all sources. Includes bet winnings, daily rewards, challenges. Active for 48 hours.",
                    new BigDecimal("150"), "attach-money", StoreItem.ItemType.CREDIT_BOOSTER,
                    StoreItem.ItemCategory.MULTIPLIERS, StoreItem.Rarity.RARE, true, false, 1);

            createItem("Hot Streak Amplifier", "Increases multiplier for each consecutive win. Win 2: 1.2x, Win 3: 1.5x, Win 4+: 2x. Lasts 7 days or until you lose.",
                    new BigDecimal("250"), "local-fire-department", StoreItem.ItemType.MULTIPLIER,
                    StoreItem.ItemCategory.MULTIPLIERS, StoreItem.Rarity.EPIC, true, false, 2);

            createItem("Double Down", "2x payout on your next winning bet. Stackable with other bonuses. Expires after one bet (win or lose).",
                    new BigDecimal("300"), "looks-two", StoreItem.ItemType.MULTIPLIER,
                    StoreItem.ItemCategory.MULTIPLIERS, StoreItem.Rarity.EPIC, true, false, 3);

            createItem("Lightning Round", "5x payout on next win, but lose 2x stake if wrong. High risk, high reward. One-time use.",
                    new BigDecimal("500"), "flash-on", StoreItem.ItemType.MULTIPLIER,
                    StoreItem.ItemCategory.MULTIPLIERS, StoreItem.Rarity.LEGENDARY, true, false, 5);

            // Betting Tools
            createItem("Time Extension", "Extend betting deadline by 1 hour (for yourself only). Gives you more time to decide. One-time use per bet.",
                    new BigDecimal("150"), "schedule", StoreItem.ItemType.TIME_EXTENSION,
                    StoreItem.ItemCategory.BETTING_TOOLS, StoreItem.Rarity.RARE, true, false, 1);

            createItem("Side Bet Creator", "Create a side bet within an existing bet. Earn credits if others join your side bet. 3 uses per purchase.",
                    new BigDecimal("200"), "casino", StoreItem.ItemType.SIDE_BET_CREATOR,
                    StoreItem.ItemCategory.BETTING_TOOLS, StoreItem.Rarity.EPIC, true, false, 2);

            // Discounts
            createItem("Half-Price Ticket", "Next bet stake costs 50% less. Still get full payout if you win. One-time use.",
                    new BigDecimal("80"), "local-offer", StoreItem.ItemType.DISCOUNT_TICKET,
                    StoreItem.ItemCategory.DISCOUNTS, StoreItem.Rarity.UNCOMMON, true, false, 1);

            createItem("Free Entry Pass", "Enter any bet completely free (0 stake). Win the full payout if correct. One-time use.",
                    new BigDecimal("150"), "confirmation-number", StoreItem.ItemType.DISCOUNT_TICKET,
                    StoreItem.ItemCategory.DISCOUNTS, StoreItem.Rarity.RARE, true, false, 2);

            createItem("Refund Voucher", "Get your stake back on next bet (win or lose). You keep winnings if you win. One-time use.",
                    new BigDecimal("200"), "card-giftcard", StoreItem.ItemType.DISCOUNT_TICKET,
                    StoreItem.ItemCategory.DISCOUNTS, StoreItem.Rarity.RARE, true, false, 3);

            createItem("VIP Pass (7 Days)", "10% discount on all bet stakes for 7 days. Full payouts on wins. Stackable with other discounts.",
                    new BigDecimal("300"), "card-membership", StoreItem.ItemType.VIP_PASS,
                    StoreItem.ItemCategory.DISCOUNTS, StoreItem.Rarity.EPIC, true, false, 4);

            // Boosters
            createItem("Challenge Booster", "Earn 50% more from completed challenges. Active for 7 days.",
                    new BigDecimal("150"), "emoji-events", StoreItem.ItemType.CHALLENGE_BOOSTER,
                    StoreItem.ItemCategory.BOOSTERS, StoreItem.Rarity.RARE, true, false, 1);

            createItem("Daily Bonus Doubler", "2x daily login rewards for 14 days. Stacks with streaks.",
                    new BigDecimal("200"), "card-giftcard", StoreItem.ItemType.DAILY_BOOSTER,
                    StoreItem.ItemCategory.BOOSTERS, StoreItem.Rarity.EPIC, true, false, 2);

            createItem("Referral Multiplier", "Earn 2x credits from friend referrals. Active for 30 days. Stacks with normal referral bonus.",
                    new BigDecimal("300"), "group", StoreItem.ItemType.REFERRAL_BOOSTER,
                    StoreItem.ItemCategory.BOOSTERS, StoreItem.Rarity.EPIC, true, false, 3);

            System.out.println("Store items initialized successfully!");
        };
    }

    private void createItem(String name, String description, BigDecimal price, String iconUrl,
                           StoreItem.ItemType itemType, StoreItem.ItemCategory category,
                           StoreItem.Rarity rarity, boolean isActive, boolean isFeatured, int sortOrder) {
        StoreItem item = new StoreItem();
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setIconUrl(iconUrl);
        item.setItemType(itemType);
        item.setCategory(category);
        item.setRarity(rarity);
        item.setIsActive(isActive);
        item.setIsFeatured(isFeatured);
        item.setIsLimitedTime(false);
        item.setSortOrder(sortOrder);

        storeItemRepository.save(item);
        System.out.println("Created store item: " + name);
    }
}

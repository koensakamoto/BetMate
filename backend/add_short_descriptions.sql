-- Add short descriptions to existing store items
-- This is a one-time script to populate the shortDescription field for existing items

-- Update items with concise 2-line descriptions (max 100 chars)
UPDATE store_items SET short_description = 'Hold your bet with unshakeable confidence' WHERE name = 'Diamond Hands';
UPDATE store_items SET short_description = 'Place a guaranteed zero-risk bet' WHERE name = 'Sure Shot';
UPDATE store_items SET short_description = 'Triple your winnings with this boost' WHERE name = 'Triple Threat';
UPDATE store_items SET short_description = 'Unlock VIP benefits for 30 days' WHERE name = 'VIP Pass (30 Days)';
UPDATE store_items SET short_description = 'Basic insurance protection for your bet' WHERE name = 'Bet Insurance (Basic)';
UPDATE store_items SET short_description = 'Premium insurance with full coverage' WHERE name = 'Bet Insurance (Premium)';
UPDATE store_items SET short_description = 'Freeze a bet and withdraw your stake' WHERE name = 'Freeze Card';
UPDATE store_items SET short_description = 'Create counter-bets at discount rate' WHERE name = 'Hedge Helper';
UPDATE store_items SET short_description = 'Change your bet choice after deadline' WHERE name = 'Mulligan Token';
UPDATE store_items SET short_description = 'Elite insurance with maximum protection' WHERE name = 'Bet Insurance (Elite)';
UPDATE store_items SET short_description = 'Earn bonus credits on every transaction' WHERE name = 'Credit Booster';
UPDATE store_items SET short_description = 'Amplify your winning streak rewards' WHERE name = 'Hot Streak Amplifier';
UPDATE store_items SET short_description = 'Double your stake for bigger wins' WHERE name = 'Double Down';
UPDATE store_items SET short_description = 'Accelerate your betting with speed boost' WHERE name = 'Lightning Round';
UPDATE store_items SET short_description = 'Extend betting deadline by 24 hours' WHERE name = 'Time Extension';
UPDATE store_items SET short_description = 'Create custom side bets for friends' WHERE name = 'Side Bet Creator';
UPDATE store_items SET short_description = 'Reduce bet stake costs by 50%' WHERE name = 'Half-Price Ticket';
UPDATE store_items SET short_description = 'Enter one bet completely free' WHERE name = 'Free Entry Pass';
UPDATE store_items SET short_description = 'Get a full refund on losing bet' WHERE name = 'Refund Voucher';
UPDATE store_items SET short_description = 'Unlock VIP benefits for 7 days' WHERE name = 'VIP Pass (7 Days)';
UPDATE store_items SET short_description = 'Earn more from challenge completions' WHERE name = 'Challenge Booster';
UPDATE store_items SET short_description = 'Double your daily login bonus' WHERE name = 'Daily Bonus Doubler';
UPDATE store_items SET short_description = 'Maximize referral reward bonuses' WHERE name = 'Referral Multiplier';

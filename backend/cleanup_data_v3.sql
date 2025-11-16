-- BetMate Database Cleanup Script V3
-- Deletes all data except user ID=2
-- This uses a simpler approach: truncate most tables, then delete specific user data

START TRANSACTION;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Completely truncate these tables (they'll be empty)
TRUNCATE TABLE bet_resolution_votes;
TRUNCATE TABLE bet_fulfillments;
TRUNCATE TABLE bet_predictions;
TRUNCATE TABLE bet_participations;
TRUNCATE TABLE bet_resolvers;
TRUNCATE TABLE bets;
TRUNCATE TABLE messages;
TRUNCATE TABLE group_memberships;
TRUNCATE TABLE `groups`;
TRUNCATE TABLE friendships;
TRUNCATE TABLE notifications;
TRUNCATE TABLE transactions;
TRUNCATE TABLE user_inventory;
TRUNCATE TABLE group_reward_actions;

-- Delete user settings for all except user 2
DELETE FROM user_settings WHERE user_id != 2;

-- Delete all users except ID=2
DELETE FROM users WHERE id != 2;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

-- Display remaining data
SELECT 'Data cleanup complete!' as status;
SELECT 'Remaining user:' as info;
SELECT id, username, email, first_name, last_name FROM users;

-- Show counts
SELECT 'Table Counts:' as summary;
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Bets', COUNT(*) FROM bets
UNION ALL
SELECT 'Groups', COUNT(*) FROM `groups`
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Friendships', COUNT(*) FROM friendships
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'User Settings', COUNT(*) FROM user_settings;

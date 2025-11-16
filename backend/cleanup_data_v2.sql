-- BetMate Database Cleanup Script V2
-- Deletes all data except user ID=2
-- WARNING: This will delete all data except for user 2

START TRANSACTION;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Delete bet resolution votes
TRUNCATE TABLE bet_resolution_votes;

-- Delete bet fulfillments
TRUNCATE TABLE bet_fulfillments;

-- Delete bet participations (keep only user 2's)
DELETE FROM bet_participations WHERE user_id != 2;

-- Delete bet predictions (keep only user 2's)
DELETE FROM bet_predictions WHERE user_id != 2;

-- Delete bet resolvers
TRUNCATE TABLE bet_resolvers;

-- Delete bets (keep only user 2's)
DELETE FROM bets WHERE creator_id != 2;

-- Delete messages (keep only user 2's)
DELETE FROM messages WHERE sender_id != 2;

-- Delete group memberships (keep only user 2's)
DELETE FROM group_memberships WHERE user_id != 2;

-- Delete groups (keep only user 2's)
DELETE FROM groups WHERE creator_id != 2;

-- Delete friendships (keep only those involving user 2)
DELETE FROM friendships WHERE user1_id != 2 AND user2_id != 2;

-- Delete notifications (keep only user 2's)
DELETE FROM notifications WHERE user_id != 2;

-- Delete transactions (keep only user 2's)
DELETE FROM transactions WHERE user_id != 2;

-- Delete user inventory (keep only user 2's)
DELETE FROM user_inventory WHERE user_id != 2;

-- Delete user settings (keep only user 2's)
DELETE FROM user_settings WHERE user_id != 2;

-- Delete group reward actions
TRUNCATE TABLE group_reward_actions;

-- Delete all users except ID=2
DELETE FROM users WHERE id != 2;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

-- Display remaining data counts
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Bets', COUNT(*) FROM bets
UNION ALL
SELECT 'Bet Participations', COUNT(*) FROM bet_participations
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Group Memberships', COUNT(*) FROM group_memberships
UNION ALL
SELECT 'Friendships', COUNT(*) FROM friendships
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'User Inventory', COUNT(*) FROM user_inventory;

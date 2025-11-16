-- BetMate Database Cleanup Script
-- Deletes all data except user ID=2 and preserves referential integrity

-- Start transaction
START TRANSACTION;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete bet-related data (except those involving user 2)
DELETE FROM bet_resolution_votes WHERE bet_id IN (
    SELECT id FROM bets WHERE creator_id != 2
);

DELETE FROM bet_fulfillments WHERE bet_id IN (
    SELECT id FROM bets WHERE creator_id != 2
);

DELETE FROM bet_participations WHERE user_id != 2;
DELETE FROM bet_participations WHERE bet_id IN (
    SELECT id FROM bets WHERE creator_id != 2
);

DELETE FROM bet_predictions WHERE user_id != 2;
DELETE FROM bet_predictions WHERE bet_id IN (
    SELECT id FROM bets WHERE creator_id != 2
);

DELETE FROM bets WHERE creator_id != 2;

-- Delete group-related data (except groups created by user 2)
DELETE FROM messages WHERE sender_id != 2;
DELETE FROM messages WHERE group_id IN (
    SELECT id FROM groups WHERE creator_id != 2
);

DELETE FROM group_memberships WHERE user_id != 2;
DELETE FROM group_memberships WHERE group_id IN (
    SELECT id FROM groups WHERE creator_id != 2
);

DELETE FROM groups WHERE creator_id != 2;

-- Delete friendships not involving user 2
DELETE FROM friendships WHERE user_id != 2 AND friend_id != 2;

-- Delete notifications for other users
DELETE FROM notifications WHERE user_id != 2;

-- Delete transactions for other users
DELETE FROM transactions WHERE user_id != 2;

-- Delete user inventory for other users
DELETE FROM user_inventories WHERE user_id != 2;

-- Delete user settings for other users
DELETE FROM user_settings WHERE user_id != 2;

-- Finally, delete all users except ID=2
DELETE FROM users WHERE id != 2;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Commit transaction
COMMIT;

-- Display remaining data counts
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Bets', COUNT(*) FROM bets
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Friendships', COUNT(*) FROM friendships
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;

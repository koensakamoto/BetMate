-- =========================================
-- Add Default UserSettings for Existing Users
-- =========================================
-- This script creates default UserSettings entries for all users
-- who don't have settings yet, with PUBLIC profile visibility.
--
-- Run this script once to fix existing users in your database.
-- New users will automatically get settings created via the application code.
-- =========================================

-- Insert default settings for users that don't have settings yet
INSERT INTO user_settings (
    user_id,
    push_notifications,
    bet_result_notifications,
    group_invite_notifications,
    profile_visibility,
    default_bet_amount,
    email_notifications,
    theme,
    timezone,
    created_at,
    updated_at
)
SELECT
    u.id AS user_id,
    TRUE AS push_notifications,
    TRUE AS bet_result_notifications,
    TRUE AS group_invite_notifications,
    'PUBLIC' AS profile_visibility,  -- Default to PUBLIC
    10.00 AS default_bet_amount,
    FALSE AS email_notifications,
    'LIGHT' AS theme,
    'UTC' AS timezone,
    NOW() AS created_at,
    NOW() AS updated_at
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE us.user_id IS NULL  -- Only insert for users without settings
  AND u.deleted_at IS NULL  -- Only active users
ORDER BY u.id;

-- Verify the results
SELECT
    COUNT(*) as total_users,
    COUNT(us.user_id) as users_with_settings,
    COUNT(*) - COUNT(us.user_id) as users_without_settings
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE u.deleted_at IS NULL;

-- Show sample of users with settings
SELECT
    u.id,
    u.username,
    us.profile_visibility,
    us.created_at as settings_created
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE u.deleted_at IS NULL
ORDER BY u.id
LIMIT 10;

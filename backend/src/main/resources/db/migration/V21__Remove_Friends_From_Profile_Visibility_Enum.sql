-- Remove unused 'FRIENDS' value from profile_visibility enum
-- The entity only supports PUBLIC and PRIVATE

-- First, update any rows that might have FRIENDS to PRIVATE (should be none)
UPDATE user_settings SET profile_visibility = 'PRIVATE' WHERE profile_visibility = 'FRIENDS';

-- Alter the column to remove FRIENDS from the enum
ALTER TABLE user_settings
MODIFY COLUMN profile_visibility ENUM('PUBLIC', 'PRIVATE') NOT NULL;

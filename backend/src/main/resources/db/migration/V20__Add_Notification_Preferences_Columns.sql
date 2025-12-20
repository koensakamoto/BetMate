-- Add notification preference columns to user_settings table

-- Betting notifications
ALTER TABLE user_settings ADD COLUMN bet_created_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN bet_updated_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN bet_deadline_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN bet_resolution_reminder_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN bet_cancelled_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN bet_fulfillment_notifications BOOLEAN NOT NULL DEFAULT true;

-- Group notifications
ALTER TABLE user_settings ADD COLUMN group_message_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN group_member_joined_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN group_member_left_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN group_role_changed_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN group_join_request_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN group_deleted_notifications BOOLEAN NOT NULL DEFAULT true;

-- Social notifications
ALTER TABLE user_settings ADD COLUMN friend_notifications BOOLEAN NOT NULL DEFAULT true;

-- System notifications
ALTER TABLE user_settings ADD COLUMN account_security_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN system_announcement_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN promotion_notifications BOOLEAN NOT NULL DEFAULT false;

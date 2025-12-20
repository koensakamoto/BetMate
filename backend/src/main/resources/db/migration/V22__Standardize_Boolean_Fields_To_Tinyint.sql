-- Standardize boolean fields from bit(1) to tinyint(1) for consistency
-- tinyint(1) has better JDBC/Hibernate compatibility and cleaner debugging

-- user_settings table: convert old bit(1) fields to tinyint(1)
ALTER TABLE user_settings
    MODIFY COLUMN push_notifications TINYINT(1) NOT NULL DEFAULT 1,
    MODIFY COLUMN bet_result_notifications TINYINT(1) NOT NULL DEFAULT 1,
    MODIFY COLUMN email_notifications TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN group_invite_notifications TINYINT(1) NOT NULL DEFAULT 1;

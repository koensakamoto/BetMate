-- Migration: Add betting deadline reminder tracking timestamps to bets table
-- Description: Adds two new columns to track when 24-hour and 1-hour betting deadline reminders were sent
-- Author: System
-- Date: 2025-01-17

ALTER TABLE bets
ADD COLUMN betting_24_hour_reminder_sent_at DATETIME NULL COMMENT 'Timestamp when 24-hour betting deadline reminder was sent',
ADD COLUMN betting_1_hour_reminder_sent_at DATETIME NULL COMMENT 'Timestamp when 1-hour betting deadline reminder was sent';

-- Add indexes for better query performance
CREATE INDEX idx_bets_betting_24h_reminder ON bets(betting_24_hour_reminder_sent_at);
CREATE INDEX idx_bets_betting_1h_reminder ON bets(betting_1_hour_reminder_sent_at);

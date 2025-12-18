-- Add failed_attempts column to password_reset_tokens table for tracking brute-force attempts
ALTER TABLE password_reset_tokens
ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0;

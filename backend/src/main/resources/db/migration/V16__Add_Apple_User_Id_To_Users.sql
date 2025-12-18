-- Add apple_user_id column to users table for Apple Sign-In support
ALTER TABLE users ADD COLUMN apple_user_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups by Apple user ID
CREATE INDEX idx_user_apple_user_id ON users(apple_user_id);

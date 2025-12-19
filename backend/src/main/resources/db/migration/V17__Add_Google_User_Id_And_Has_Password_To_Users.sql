-- Add google_user_id column to users table for Google Sign-In support
ALTER TABLE users ADD COLUMN google_user_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups by Google user ID
CREATE INDEX idx_user_google_user_id ON users(google_user_id);

-- Add has_password column to track if user has set a password (OAuth users may not have one)
ALTER TABLE users ADD COLUMN has_password BOOLEAN NOT NULL DEFAULT true;

-- Set has_password to false for existing OAuth users (Google and Apple)
-- These users signed up via OAuth and don't have a real password set
UPDATE users SET has_password = false WHERE auth_provider IN ('GOOGLE', 'APPLE');

-- Adds server-side password storage for authentication and password resets.
-- Existing accounts must use Reset once before signing in with a password.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

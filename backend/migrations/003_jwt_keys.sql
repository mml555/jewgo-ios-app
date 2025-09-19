-- Migration: Add JWT key rotation support
-- Description: Creates tables and functions for JWT key management and rotation

-- Create JWT keys table
CREATE TABLE IF NOT EXISTS jwt_keys (
    id SERIAL PRIMARY KEY,
    key_id VARCHAR(32) UNIQUE NOT NULL,
    key_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    created_by VARCHAR(255) DEFAULT 'system',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jwt_keys_key_id ON jwt_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_jwt_keys_active ON jwt_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jwt_keys_expires ON jwt_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_jwt_keys_created ON jwt_keys(created_at);

-- Create function to cleanup expired JWT keys
CREATE OR REPLACE FUNCTION cleanup_expired_jwt_keys()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM jwt_keys 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get current active JWT key
CREATE OR REPLACE FUNCTION get_current_jwt_key()
RETURNS TABLE(
    key_id VARCHAR(32),
    key_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT k.key_id, k.key_data, k.created_at, k.expires_at
    FROM jwt_keys k
    WHERE k.is_active = TRUE 
      AND k.expires_at > NOW()
    ORDER BY k.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to rotate JWT keys
CREATE OR REPLACE FUNCTION rotate_jwt_key(
    new_key_id VARCHAR(32),
    new_key_data TEXT,
    key_lifetime_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS BOOLEAN AS $$
DECLARE
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate expiry time
    expires_at := NOW() + (key_lifetime_hours || ' hours')::INTERVAL;
    
    -- Deactivate all current keys
    UPDATE jwt_keys SET is_active = FALSE WHERE is_active = TRUE;
    
    -- Insert new key
    INSERT INTO jwt_keys (key_id, key_data, expires_at, is_active)
    VALUES (new_key_id, new_key_data, expires_at, TRUE);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get JWT key statistics
CREATE OR REPLACE FUNCTION get_jwt_key_stats()
RETURNS TABLE(
    total_keys INTEGER,
    active_keys INTEGER,
    expired_keys INTEGER,
    next_expiry TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_keys,
        COUNT(*) FILTER (WHERE is_active = TRUE AND expires_at > NOW())::INTEGER as active_keys,
        COUNT(*) FILTER (WHERE expires_at <= NOW())::INTEGER as expired_keys,
        MIN(expires_at) FILTER (WHERE is_active = TRUE AND expires_at > NOW()) as next_expiry
    FROM jwt_keys;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically cleanup expired keys
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_jwt_keys()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run cleanup if we have more than 10 keys or if any key is more than 8 days old
    IF (SELECT COUNT(*) FROM jwt_keys) > 10 OR 
       (SELECT COUNT(*) FROM jwt_keys WHERE expires_at < NOW() - INTERVAL '8 days') > 0 THEN
        PERFORM cleanup_expired_jwt_keys();
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (runs on INSERT to jwt_keys)
CREATE TRIGGER jwt_keys_cleanup_trigger
    AFTER INSERT ON jwt_keys
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_jwt_keys();

-- Add comments for documentation
COMMENT ON TABLE jwt_keys IS 'Stores JWT signing keys for key rotation';
COMMENT ON COLUMN jwt_keys.key_id IS 'Unique identifier for the key';
COMMENT ON COLUMN jwt_keys.key_data IS 'The actual key material (base64url encoded)';
COMMENT ON COLUMN jwt_keys.created_at IS 'When the key was created';
COMMENT ON COLUMN jwt_keys.expires_at IS 'When the key expires and should be rotated';
COMMENT ON COLUMN jwt_keys.is_active IS 'Whether this key is currently active for signing';
COMMENT ON COLUMN jwt_keys.created_by IS 'Who or what created this key';
COMMENT ON COLUMN jwt_keys.metadata IS 'Additional metadata about the key';

COMMENT ON FUNCTION cleanup_expired_jwt_keys() IS 'Removes JWT keys that expired more than 1 day ago';
COMMENT ON FUNCTION get_current_jwt_key() IS 'Returns the current active JWT key';
COMMENT ON FUNCTION rotate_jwt_key(VARCHAR, TEXT, INTEGER) IS 'Rotates to a new JWT key';
COMMENT ON FUNCTION get_jwt_key_stats() IS 'Returns statistics about JWT keys';

-- Grant permissions (adjust as needed for your security model)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON jwt_keys TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_jwt_keys() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_current_jwt_key() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION rotate_jwt_key(VARCHAR, TEXT, INTEGER) TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_jwt_key_stats() TO your_app_user;

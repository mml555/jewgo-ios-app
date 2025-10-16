-- Migration: Add guest account support
-- Description: Adds guest role, permissions, and guest user management

-- Add guest role
INSERT INTO roles (name, description, is_system) VALUES
('guest', 'Temporary guest user with limited access', TRUE);

-- Add guest-specific permissions
INSERT INTO permissions (name, description, resource) VALUES
-- Basic read permissions for guests
('entities:read:public', 'View public business entities', 'entity'),
('reviews:read:public', 'View public reviews', 'review'),
('search:public', 'Perform public searches', 'search'),
-- Guest session management
('guest:create', 'Create guest sessions', 'guest'),
('guest:read:own', 'View own guest session', 'guest');

-- Assign permissions to guest role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'guest' 
  AND p.name IN (
    'entities:read:public', 
    'reviews:read:public', 
    'search:public',
    'guest:create',
    'guest:read:own'
  );

-- Create guest_sessions table for managing temporary guest sessions
CREATE TABLE IF NOT EXISTS guest_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_fingerprint VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for guest_sessions
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires ON guest_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_device ON guest_sessions(device_fingerprint);

-- Function to cleanup expired guest sessions
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM guest_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new guest session
CREATE OR REPLACE FUNCTION create_guest_session(
    p_device_fingerprint VARCHAR(255),
    p_ip_address INET,
    p_user_agent TEXT,
    p_session_duration_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
    session_id UUID,
    session_token VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    new_session_id UUID;
    new_session_token VARCHAR(255);
    new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate session ID and token
    new_session_id := uuid_generate_v4();
    new_session_token := encode(gen_random_bytes(32), 'hex');
    new_expires_at := NOW() + (p_session_duration_hours || ' hours')::INTERVAL;
    
    -- Insert guest session
    INSERT INTO guest_sessions (
        id, 
        session_token, 
        device_fingerprint, 
        ip_address, 
        user_agent, 
        expires_at
    ) VALUES (
        new_session_id,
        new_session_token,
        p_device_fingerprint,
        p_ip_address,
        p_user_agent,
        new_expires_at
    );
    
    RETURN QUERY SELECT new_session_id, new_session_token, new_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Function to validate guest session
CREATE OR REPLACE FUNCTION validate_guest_session(p_session_token VARCHAR(255))
RETURNS TABLE(
    session_id UUID,
    device_fingerprint VARCHAR(255),
    is_valid BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.id,
        gs.device_fingerprint,
        (gs.expires_at > NOW()) as is_valid,
        gs.expires_at
    FROM guest_sessions gs
    WHERE gs.session_token = p_session_token;
    
    -- Update last_used_at if session exists and is valid
    UPDATE guest_sessions 
    SET last_used_at = NOW()
    WHERE guest_sessions.session_token = p_session_token 
      AND guest_sessions.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE guest_sessions IS 'Manages temporary guest user sessions for unauthenticated access';
COMMENT ON FUNCTION create_guest_session(VARCHAR, INET, TEXT, INTEGER) IS 'Creates a new guest session with specified duration';
COMMENT ON FUNCTION validate_guest_session(VARCHAR) IS 'Validates and updates guest session activity';
COMMENT ON FUNCTION cleanup_expired_guest_sessions() IS 'Removes expired guest sessions';

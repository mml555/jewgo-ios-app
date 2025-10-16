-- Fix for validate_guest_session function - removes ambiguous column reference error

DROP FUNCTION IF EXISTS validate_guest_session(VARCHAR);

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

COMMENT ON FUNCTION validate_guest_session(VARCHAR) IS 'Validates and updates guest session activity';


-- Battle-Hardened Authentication Schema
-- Implements zero-trust, future-proof auth system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- CORE AUTH TABLES
-- ==============================================

-- Users table (minimal, normalized)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Multiple identities per user (password, webauthn, oauth)
CREATE TABLE identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('password', 'webauthn', 'oauth_google', 'oauth_apple', 'oauth_github')),
    provider VARCHAR(100), -- for OAuth providers
    subject VARCHAR(255), -- OAuth subject ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, type, provider)
);

-- Credentials (hashed secrets, public keys)
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    cred_type VARCHAR(50) NOT NULL CHECK (cred_type IN ('password_hash', 'webauthn_public_key', 'totp_secret')),
    cred_hash TEXT, -- for password hashes
    public_key TEXT, -- for WebAuthn public keys
    meta JSONB DEFAULT '{}', -- additional credential metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device tracking for security
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web', 'desktop'
    device_handle VARCHAR(255) UNIQUE NOT NULL, -- WebAuthn credential ID or device fingerprint
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    signals JSONB DEFAULT '{}', -- device fingerprint, location, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_devices_user_id (user_id),
    INDEX idx_devices_handle (device_handle)
);

-- ==============================================
-- RBAC SYSTEM (DATA-DRIVEN, NOT CODE)
-- ==============================================

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- system roles cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100), -- optional resource scope (e.g., 'entity', 'review')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many: roles have permissions
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (role_id, permission_id)
);

-- User role bindings with optional scope and expiration
CREATE TABLE user_role_bindings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    scope VARCHAR(255), -- optional: org/project/entity scope
    expires_at TIMESTAMP WITH TIME ZONE, -- optional expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    INDEX idx_user_role_bindings_user_id (user_id),
    INDEX idx_user_role_bindings_role_id (role_id),
    INDEX idx_user_role_bindings_expires (expires_at)
);

-- ==============================================
-- SESSION MANAGEMENT WITH ROTATION
-- ==============================================

-- Sessions with family-based rotation and reuse detection
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_jti UUID NOT NULL, -- family identifier for rotation
    current_jti UUID NOT NULL, -- current refresh token JTI
    refresh_hash VARCHAR(255) NOT NULL, -- hashed refresh token
    device_id UUID REFERENCES devices(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    reused_jti_of UUID, -- if this session was created due to reuse detection
    
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_family (family_jti),
    INDEX idx_sessions_current (current_jti),
    INDEX idx_sessions_expires (expires_at),
    INDEX idx_sessions_revoked (revoked_at)
);

-- ==============================================
-- AUDIT & SECURITY
-- ==============================================

-- Comprehensive auth event logging
CREATE TABLE auth_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event VARCHAR(100) NOT NULL, -- 'login', 'logout', 'register', 'mfa_challenge', etc.
    ip_address INET,
    user_agent TEXT,
    device_id UUID REFERENCES devices(id),
    success BOOLEAN NOT NULL,
    details JSONB DEFAULT '{}', -- event-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_auth_events_user_id (user_id),
    INDEX idx_auth_events_event (event),
    INDEX idx_auth_events_success (success),
    INDEX idx_auth_events_created (created_at),
    INDEX idx_auth_events_ip (ip_address)
);

-- Verification tokens (email verification, password reset)
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('email_verification', 'password_reset', 'mfa_recovery')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_verification_tokens_hash (token_hash),
    INDEX idx_verification_tokens_user (user_id),
    INDEX idx_verification_tokens_expires (expires_at)
);

-- CAPTCHA challenges with risk scoring
CREATE TABLE captcha_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow VARCHAR(50) NOT NULL, -- 'login', 'signup', 'review', 'password_reset'
    provider VARCHAR(50) NOT NULL, -- 'recaptcha_v2', 'recaptcha_v3', 'hcaptcha'
    verdict BOOLEAN NOT NULL,
    score DECIMAL(3,2), -- for v3 scoring
    ip_address INET,
    user_agent TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_captcha_challenges_flow (flow),
    INDEX idx_captcha_challenges_verdict (verdict),
    INDEX idx_captcha_challenges_ip (ip_address),
    INDEX idx_captcha_challenges_created (created_at)
);

-- ==============================================
-- DEFAULT DATA
-- ==============================================

-- Insert system roles
INSERT INTO roles (name, description, is_system) VALUES
('user', 'Regular authenticated user', TRUE),
('business_owner', 'Can manage their own business listings', TRUE),
('moderator', 'Content moderator with review permissions', TRUE),
('admin', 'System administrator with full access', TRUE);

-- Insert core permissions
INSERT INTO permissions (name, description, resource) VALUES
-- Entity management
('entities:create', 'Create new business entities', 'entity'),
('entities:read:own', 'View own business entities', 'entity'),
('entities:update:own', 'Update own business entities', 'entity'),
('entities:delete:own', 'Delete own business entities', 'entity'),
('entities:read:all', 'View all business entities', 'entity'),
('entities:update:all', 'Update any business entity', 'entity'),
('entities:delete:all', 'Delete any business entity', 'entity'),

-- Review management
('reviews:create', 'Create reviews', 'review'),
('reviews:read:own', 'View own reviews', 'review'),
('reviews:update:own', 'Update own reviews', 'review'),
('reviews:delete:own', 'Delete own reviews', 'review'),
('reviews:moderate', 'Moderate all reviews', 'review'),

-- User management
('users:read', 'View user profiles', 'user'),
('users:update', 'Update user profiles', 'user'),
('users:delete', 'Delete user accounts', 'user'),

-- System administration
('system:analytics', 'Access system analytics', 'system'),
('system:settings', 'Manage system settings', 'system'),
('system:admin', 'Access admin panel', 'system');

-- Assign permissions to roles
WITH role_perms AS (
  SELECT r.id as role_id, p.id as permission_id
  FROM roles r, permissions p
  WHERE (r.name = 'user' AND p.name IN ('entities:create', 'reviews:create', 'reviews:read:own', 'reviews:update:own', 'reviews:delete:own'))
     OR (r.name = 'business_owner' AND p.name IN ('entities:create', 'entities:read:own', 'entities:update:own', 'entities:delete:own', 'reviews:create', 'reviews:read:own', 'reviews:update:own', 'reviews:delete:own'))
     OR (r.name = 'moderator' AND p.name IN ('entities:read:all', 'entities:update:all', 'reviews:create', 'reviews:read:own', 'reviews:update:own', 'reviews:delete:own', 'reviews:moderate', 'users:read'))
     OR (r.name = 'admin' AND p.name IN ('entities:read:all', 'entities:update:all', 'entities:delete:all', 'reviews:moderate', 'users:read', 'users:update', 'users:delete', 'system:analytics', 'system:settings', 'system:admin'))
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM role_perms;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Composite indexes for common queries
CREATE INDEX idx_users_status_email ON users(status, primary_email) WHERE deleted_at IS NULL;
CREATE INDEX idx_identities_user_type ON identities(user_id, type);
CREATE INDEX idx_sessions_user_active ON sessions(user_id) WHERE revoked_at IS NULL AND expires_at > NOW();
CREATE INDEX idx_auth_events_user_time ON auth_events(user_id, created_at DESC);
CREATE INDEX idx_captcha_challenges_ip_time ON captcha_challenges(ip_address, created_at DESC);

-- Partial indexes for active records
CREATE INDEX idx_users_active ON users(id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_sessions_active ON sessions(id) WHERE revoked_at IS NULL AND expires_at > NOW();
CREATE INDEX idx_verification_tokens_active ON verification_tokens(id) WHERE used_at IS NULL AND expires_at > NOW();

-- ==============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ==============================================

-- Function to get user permissions (used by middleware)
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name VARCHAR(100), resource VARCHAR(100)) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource
  FROM user_role_bindings urb
  JOIN role_permissions rp ON urb.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE urb.user_id = user_uuid
    AND (urb.expires_at IS NULL OR urb.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, perm_name VARCHAR(100), res VARCHAR(100) DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM get_user_permissions(user_uuid) up
    WHERE up.permission_name = perm_name
      AND (res IS NULL OR up.resource = res OR up.resource IS NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all sessions for a user (family revocation)
CREATE OR REPLACE FUNCTION revoke_user_sessions(user_uuid UUID, reason VARCHAR(100) DEFAULT 'manual_revoke')
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE sessions 
  SET revoked_at = NOW()
  WHERE user_id = user_uuid 
    AND revoked_at IS NULL;
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  -- Log the revocation event
  INSERT INTO auth_events (user_id, event, success, details)
  VALUES (user_uuid, 'session_revoke_all', TRUE, jsonb_build_object('reason', reason, 'count', revoked_count));
  
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- CLEANUP PROCEDURES
-- ==============================================

-- Function to clean up expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS TABLE(expired_sessions INTEGER, expired_tokens INTEGER, expired_verifications INTEGER) AS $$
DECLARE
  session_count INTEGER;
  token_count INTEGER;
  verification_count INTEGER;
BEGIN
  -- Clean up expired sessions
  DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS session_count = ROW_COUNT;
  
  -- Clean up expired verification tokens
  DELETE FROM verification_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS verification_count = ROW_COUNT;
  
  -- Clean up old captcha challenges (keep for 30 days for analytics)
  DELETE FROM captcha_challenges WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old auth events (keep for 1 year)
  DELETE FROM auth_events WHERE created_at < NOW() - INTERVAL '1 year';
  
  RETURN QUERY SELECT session_count, 0 as token_count, verification_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE users IS 'Core user table with minimal data - all other user data in identities/credentials';
COMMENT ON TABLE identities IS 'Multiple authentication methods per user (password, webauthn, oauth)';
COMMENT ON TABLE credentials IS 'Hashed passwords, WebAuthn public keys, TOTP secrets';
COMMENT ON TABLE devices IS 'Device tracking for security and WebAuthn credential management';
COMMENT ON TABLE sessions IS 'Session management with family-based rotation and reuse detection';
COMMENT ON TABLE auth_events IS 'Comprehensive audit log for all authentication events';
COMMENT ON TABLE captcha_challenges IS 'CAPTCHA verification results with risk scoring';

COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Returns all permissions for a user across all their roles';
COMMENT ON FUNCTION user_has_permission(UUID, VARCHAR, VARCHAR) IS 'Checks if user has specific permission, optionally scoped to resource';
COMMENT ON FUNCTION revoke_user_sessions(UUID, VARCHAR) IS 'Revokes all sessions for a user (family revocation)';
COMMENT ON FUNCTION cleanup_expired_auth_data() IS 'Cleans up expired sessions, tokens, and old audit data';

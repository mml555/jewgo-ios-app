-- Complete Admin Review Queues & Moderation System Migration
-- This migration creates the complete admin system for content moderation

-- ============================================================================
-- ADMIN REVIEW QUEUES
-- ============================================================================

CREATE TABLE admin_review_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity Information
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'special', 'event', 'claim', 'job_listing', 'job_seeker_profile', 'flagged_content'
    
    -- Priority & Assignment
    priority INTEGER DEFAULT 0, -- 0 = normal, 1 = high, 2 = urgent
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    
    -- Review Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected', 'escalated'
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    
    -- Review Details
    admin_notes TEXT,
    rejection_reason TEXT,
    approval_notes TEXT,
    
    -- SLA Tracking
    sla_deadline TIMESTAMPTZ, -- When review should be completed
    is_overdue BOOLEAN GENERATED ALWAYS AS (sla_deadline IS NOT NULL AND sla_deadline < NOW() AND status = 'pending') STORED,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 2)
);

-- ============================================================================
-- CONTENT FLAGS (User-Reported Issues)
-- ============================================================================

CREATE TABLE content_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Flagged Content
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    
    -- Reporter Information
    flagged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_email VARCHAR(255), -- For anonymous reports
    
    -- Flag Details
    flag_type VARCHAR(50) NOT NULL, -- 'inappropriate', 'spam', 'fake', 'copyright', 'harassment', 'illegal', 'other'
    reason TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Review Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed', 'escalated'
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    
    -- Resolution
    admin_notes TEXT,
    resolution TEXT,
    action_taken VARCHAR(100), -- 'content_removed', 'user_warned', 'user_banned', 'no_action', 'content_edited'
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADMIN ACTIONS LOG
-- ============================================================================

CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Admin Information
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255),
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'flag', 'ban', 'edit', 'delete', 'assign', 'escalate'
    entity_id UUID,
    entity_type VARCHAR(50),
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action Context
    reason TEXT,
    notes TEXT,
    previous_value JSONB,
    new_value JSONB,
    
    -- Request Info
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Metadata
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADMIN PERMISSIONS
-- ============================================================================

-- Extend users table for admin capabilities
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_level') THEN
        ALTER TABLE users ADD COLUMN admin_level INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_permissions') THEN
        ALTER TABLE users ADD COLUMN admin_permissions JSONB DEFAULT '{}';
    END IF;
END $$;

-- Admin Roles
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    level INTEGER NOT NULL, -- 1 = moderator, 2 = admin, 3 = super_admin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Role Assignments
CREATE TABLE admin_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ============================================================================
-- REVIEW STATISTICS
-- ============================================================================

CREATE TABLE review_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Statistics Period
    date DATE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'escalate'
    
    -- Counts
    count INTEGER DEFAULT 1,
    avg_review_time_seconds INTEGER, -- Average time to review
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(admin_id, date, entity_type, action_type)
);

-- ============================================================================
-- MODERATION RULES
-- ============================================================================

CREATE TABLE moderation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Rule Details
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'keyword', 'pattern', 'auto_flag', 'auto_reject'
    entity_types VARCHAR(50)[] NOT NULL, -- Which entity types this rule applies to
    
    -- Rule Configuration
    pattern TEXT, -- Regex pattern or keyword
    severity VARCHAR(20) DEFAULT 'medium',
    action VARCHAR(50) NOT NULL, -- 'flag', 'reject', 'require_review', 'notify_admin'
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Review Queue Indexes
CREATE INDEX idx_admin_review_queues_entity ON admin_review_queues(entity_id, entity_type);
CREATE INDEX idx_admin_review_queues_status ON admin_review_queues(status);
CREATE INDEX idx_admin_review_queues_priority ON admin_review_queues(priority DESC, created_at ASC);
CREATE INDEX idx_admin_review_queues_assigned ON admin_review_queues(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_admin_review_queues_overdue ON admin_review_queues(is_overdue) WHERE is_overdue = true;

-- Content Flags Indexes
CREATE INDEX idx_content_flags_entity ON content_flags(entity_id, entity_type);
CREATE INDEX idx_content_flags_status ON content_flags(status);
CREATE INDEX idx_content_flags_severity ON content_flags(severity);
CREATE INDEX idx_content_flags_flagged_by ON content_flags(flagged_by) WHERE flagged_by IS NOT NULL;

-- Admin Actions Indexes
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_entity ON admin_actions(entity_id, entity_type);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Admin Roles
INSERT INTO admin_roles (key, name, description, level, permissions) VALUES
('moderator', 'Moderator', 'Can review and moderate content', 1, 
 '{"review_content": true, "flag_content": true, "view_reports": true}'::jsonb),
('admin', 'Administrator', 'Full admin access except user management', 2,
 '{"review_content": true, "approve_claims": true, "manage_content": true, "view_analytics": true, "assign_reviews": true}'::jsonb),
('super_admin', 'Super Administrator', 'Full system access', 3,
 '{"all": true}'::jsonb);

-- ============================================================================
-- FUNCTIONS FOR ADMIN DASHBOARD
-- ============================================================================

-- Function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    pending_reviews INTEGER,
    pending_claims INTEGER,
    pending_flags INTEGER,
    overdue_reviews INTEGER,
    reviews_today INTEGER,
    approvals_today INTEGER,
    rejections_today INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM admin_review_queues WHERE status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM listing_claims WHERE status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM content_flags WHERE status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM admin_review_queues WHERE is_overdue = true),
        (SELECT COUNT(*)::INTEGER FROM admin_actions WHERE DATE(created_at) = CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM admin_actions WHERE DATE(created_at) = CURRENT_DATE AND action_type = 'approve'),
        (SELECT COUNT(*)::INTEGER FROM admin_actions WHERE DATE(created_at) = CURRENT_DATE AND action_type = 'reject');
END;
$$ LANGUAGE plpgsql;

-- Function to get admin performance metrics
CREATE OR REPLACE FUNCTION get_admin_performance(p_admin_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_reviews INTEGER,
    total_approvals INTEGER,
    total_rejections INTEGER,
    avg_review_time_seconds INTEGER,
    reviews_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_reviews,
        COUNT(*) FILTER (WHERE action_type = 'approve')::INTEGER as total_approvals,
        COUNT(*) FILTER (WHERE action_type = 'reject')::INTEGER as total_rejections,
        AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)))::INTEGER as avg_review_time_seconds,
        jsonb_object_agg(entity_type, count) as reviews_by_type
    FROM admin_actions
    WHERE admin_id = p_admin_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND action_type IN ('approve', 'reject')
    GROUP BY entity_type;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE admin_review_queues IS 'Unified review queue for all content requiring admin approval';
COMMENT ON TABLE content_flags IS 'User-reported content issues and violations';
COMMENT ON TABLE admin_actions IS 'Complete audit log of all admin actions for compliance';

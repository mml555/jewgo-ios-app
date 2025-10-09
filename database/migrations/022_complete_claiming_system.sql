-- Complete Listing Claiming System Migration
-- This migration creates the complete claiming system for business verification

-- ============================================================================
-- LISTING CLAIMS TABLE
-- ============================================================================

CREATE TABLE listing_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity Information
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'restaurant', 'synagogue', 'mikvah', 'store'
    
    -- Claimant Information
    claimant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claimant_name VARCHAR(255) NOT NULL,
    claimant_phone VARCHAR(20) NOT NULL,
    claimant_email VARCHAR(255) NOT NULL,
    claimant_notes TEXT,
    claimant_role VARCHAR(100), -- 'owner', 'manager', 'rabbi', 'administrator'
    
    -- Verification Details
    business_name VARCHAR(255),
    business_tax_id VARCHAR(50),
    business_license_number VARCHAR(100),
    years_at_business INTEGER,
    
    -- Review Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected', 'cancelled', 'additional_info_required'
    priority INTEGER DEFAULT 0, -- 0 = normal, 1 = high, 2 = urgent
    
    -- Admin Review
    admin_notes TEXT,
    rejection_reason TEXT,
    additional_info_requested TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(entity_id, entity_type, claimant_id),
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('restaurant', 'synagogue', 'mikvah', 'store'))
);

-- ============================================================================
-- CLAIM EVIDENCE
-- ============================================================================

CREATE TABLE claim_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES listing_claims(id) ON DELETE CASCADE,
    
    -- Evidence Details
    evidence_type VARCHAR(50) NOT NULL, -- 'business_license', 'tax_id', 'utility_bill', 'photo', 'document', 'other'
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    
    -- Description
    title VARCHAR(255),
    description TEXT,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    
    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size IS NULL OR file_size <= 52428800) -- 50MB max
);

-- ============================================================================
-- CLAIM HISTORY (Audit Trail)
-- ============================================================================

CREATE TABLE claim_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES listing_claims(id) ON DELETE CASCADE,
    
    -- Action Details
    action VARCHAR(50) NOT NULL, -- 'created', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'info_requested', 'info_provided'
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_by_type VARCHAR(20), -- 'claimant', 'admin', 'system'
    
    -- Details
    notes TEXT,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLAIM NOTIFICATIONS
-- ============================================================================

CREATE TABLE claim_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES listing_claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL, -- 'claim_submitted', 'under_review', 'approved', 'rejected', 'info_requested'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Delivery
    sent_via_email BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    sent_via_push BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADD OWNERSHIP COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add ownership tracking to restaurants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'owner_id') THEN
        ALTER TABLE restaurants ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE restaurants ADD COLUMN claimed_at TIMESTAMPTZ;
        ALTER TABLE restaurants ADD COLUMN is_claimed BOOLEAN DEFAULT FALSE;
        ALTER TABLE restaurants ADD COLUMN claim_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add ownership tracking to synagogues
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'synagogues' AND column_name = 'owner_id') THEN
        ALTER TABLE synagogues ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE synagogues ADD COLUMN claimed_at TIMESTAMPTZ;
        ALTER TABLE synagogues ADD COLUMN is_claimed BOOLEAN DEFAULT FALSE;
        ALTER TABLE synagogues ADD COLUMN claim_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add ownership tracking to mikvahs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mikvahs' AND column_name = 'owner_id') THEN
        ALTER TABLE mikvahs ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE mikvahs ADD COLUMN claimed_at TIMESTAMPTZ;
        ALTER TABLE mikvahs ADD COLUMN is_claimed BOOLEAN DEFAULT FALSE;
        ALTER TABLE mikvahs ADD COLUMN claim_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add ownership tracking to stores
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'owner_id') THEN
        ALTER TABLE stores ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE stores ADD COLUMN claimed_at TIMESTAMPTZ;
        ALTER TABLE stores ADD COLUMN is_claimed BOOLEAN DEFAULT FALSE;
        ALTER TABLE stores ADD COLUMN claim_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Claims Indexes
CREATE INDEX idx_listing_claims_entity ON listing_claims(entity_id, entity_type);
CREATE INDEX idx_listing_claims_claimant ON listing_claims(claimant_id);
CREATE INDEX idx_listing_claims_status ON listing_claims(status);
CREATE INDEX idx_listing_claims_priority ON listing_claims(priority DESC, created_at ASC);
CREATE INDEX idx_listing_claims_reviewed_by ON listing_claims(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- Evidence Indexes
CREATE INDEX idx_claim_evidence_claim ON claim_evidence(claim_id);
CREATE INDEX idx_claim_evidence_type ON claim_evidence(evidence_type);

-- History Indexes
CREATE INDEX idx_claim_history_claim ON claim_history(claim_id);
CREATE INDEX idx_claim_history_created ON claim_history(created_at DESC);

-- Notifications Indexes
CREATE INDEX idx_claim_notifications_user ON claim_notifications(user_id);
CREATE INDEX idx_claim_notifications_claim ON claim_notifications(claim_id);
CREATE INDEX idx_claim_notifications_unread ON claim_notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================================
-- FUNCTIONS FOR CLAIM MANAGEMENT
-- ============================================================================

-- Function to log claim actions
CREATE OR REPLACE FUNCTION log_claim_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO claim_history (claim_id, action, performed_by, performed_by_type, new_status, notes)
        VALUES (NEW.id, 'created', NEW.claimant_id, 'claimant', NEW.status, 'Claim submitted');
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO claim_history (claim_id, action, performed_by, performed_by_type, previous_status, new_status, notes)
        VALUES (NEW.id, 'status_changed', NEW.reviewed_by, 'admin', OLD.status, NEW.status, NEW.admin_notes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_claim_action_trigger
AFTER INSERT OR UPDATE ON listing_claims
    FOR EACH ROW EXECUTE FUNCTION log_claim_action();

-- Function to update entity ownership on approval
CREATE OR REPLACE FUNCTION update_entity_ownership()
RETURNS TRIGGER AS $$
DECLARE
    table_name TEXT;
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Determine table name
        table_name := CASE NEW.entity_type
            WHEN 'restaurant' THEN 'restaurants'
            WHEN 'synagogue' THEN 'synagogues'
            WHEN 'mikvah' THEN 'mikvahs'
            WHEN 'store' THEN 'stores'
        END;
        
        -- Update ownership
        EXECUTE format(
            'UPDATE %I SET owner_id = $1, is_claimed = true, claimed_at = NOW(), claim_verified = true WHERE id = $2',
            table_name
        ) USING NEW.claimant_id, NEW.entity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entity_ownership_trigger
AFTER UPDATE ON listing_claims
    FOR EACH ROW EXECUTE FUNCTION update_entity_ownership();

-- ============================================================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW pending_claims_summary AS
SELECT 
    lc.id,
    lc.entity_type,
    lc.claimant_name,
    lc.claimant_email,
    lc.status,
    lc.priority,
    lc.created_at,
    COUNT(ce.id) as evidence_count,
    CASE 
        WHEN lc.entity_type = 'restaurant' THEN r.name
        WHEN lc.entity_type = 'synagogue' THEN s.name
        WHEN lc.entity_type = 'mikvah' THEN m.name
        WHEN lc.entity_type = 'store' THEN st.name
    END as entity_name,
    CASE 
        WHEN lc.entity_type = 'restaurant' THEN r.address
        WHEN lc.entity_type = 'synagogue' THEN s.address
        WHEN lc.entity_type = 'mikvah' THEN m.address
        WHEN lc.entity_type = 'store' THEN st.address
    END as entity_address
FROM listing_claims lc
LEFT JOIN claim_evidence ce ON lc.id = ce.claim_id
LEFT JOIN restaurants r ON lc.entity_type = 'restaurant' AND lc.entity_id = r.id
LEFT JOIN synagogues s ON lc.entity_type = 'synagogue' AND lc.entity_id = s.id
LEFT JOIN mikvahs m ON lc.entity_type = 'mikvah' AND lc.entity_id = m.id
LEFT JOIN stores st ON lc.entity_type = 'store' AND lc.entity_id = st.id
WHERE lc.status IN ('pending', 'under_review', 'additional_info_required')
GROUP BY lc.id, r.name, r.address, s.name, s.address, m.name, m.address, st.name, st.address
ORDER BY lc.priority DESC, lc.created_at ASC;

COMMENT ON TABLE listing_claims IS 'Business owner verification and listing claiming system with admin review';
COMMENT ON TABLE claim_evidence IS 'Supporting documents for listing claims (licenses, tax IDs, photos)';
COMMENT ON TABLE claim_history IS 'Complete audit trail of all claim actions';

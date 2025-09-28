-- Enhanced Specials Schema with Production-Ready Optimizations
-- Date: 2025-01-19
-- Description: Complete specials integration with enhanced entities schema

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================================
-- ENHANCED SPECIALS TABLE
-- =============================================================================

-- Create enum types for specials
CREATE TYPE discount_kind AS ENUM ('percentage', 'fixed_amount', 'bogo', 'free_item', 'other');
CREATE TYPE claim_status AS ENUM ('claimed', 'redeemed', 'expired', 'cancelled', 'revoked');

-- Enhanced specials table with production optimizations
CREATE TABLE specials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    
    -- Discount Information
    discount_type discount_kind NOT NULL,
    discount_value NUMERIC(10,2),
    discount_label VARCHAR(100) NOT NULL,
    
    -- Validity Period (enhanced with tstzrange)
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    validity tstzrange GENERATED ALWAYS AS (tstzrange(valid_from, valid_until, '[]')) STORED,
    
    -- Status and Limits
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_claims_total INTEGER,
    max_claims_per_user INTEGER DEFAULT 1,
    claims_total INTEGER NOT NULL DEFAULT 0, -- counter cache for performance
    priority INTEGER NOT NULL DEFAULT 0, -- for "top special" selection
    
    -- Terms and Conditions
    requires_code BOOLEAN DEFAULT FALSE,
    code_hint VARCHAR(100),
    terms TEXT,
    
    -- Media
    hero_image_url TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT ck_valid_window CHECK (valid_from < valid_until),
    CONSTRAINT ck_discount_value CHECK (
        (discount_type <> 'percentage') OR (discount_value IS NULL OR (discount_value > 0 AND discount_value <= 100))
    )
);

-- =============================================================================
-- SPECIAL CLAIMS TABLE (Append-Only)
-- =============================================================================

CREATE TABLE special_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    special_id UUID NOT NULL REFERENCES specials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    status claim_status NOT NULL DEFAULT 'claimed',
    redeemed_at TIMESTAMPTZ,
    redeemed_by UUID REFERENCES users(id), -- business staff
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,
    
    -- Ensure either user_id or guest_session_id is provided
    CONSTRAINT ck_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR 
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

-- =============================================================================
-- SPECIAL MEDIA TABLE
-- =============================================================================

CREATE TABLE special_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    special_id UUID NOT NULL REFERENCES specials(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- SPECIAL EVENTS TABLE (Analytics)
-- =============================================================================

CREATE TABLE special_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    special_id UUID NOT NULL REFERENCES specials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'share', 'click', 'claim')),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    
    -- Ensure either user_id or guest_session_id is provided
    CONSTRAINT ck_ev_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR 
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

-- =============================================================================
-- PRODUCTION-READY INDEXES
-- =============================================================================

-- Core business relationship index
CREATE INDEX idx_specials_business_id ON specials(business_id);

-- GiST index for time-window queries (THE KEY OPTIMIZATION)
CREATE INDEX idx_specials_validity_gist ON specials USING gist (validity);

-- Priority-based selection index
CREATE INDEX idx_specials_business_priority_until
  ON specials (business_id, priority DESC, valid_until ASC);

-- Status filtering index
CREATE INDEX idx_specials_enabled ON specials (is_enabled);

-- Time-based queries
CREATE INDEX idx_specials_valid_from ON specials (valid_from);
CREATE INDEX idx_specials_valid_until ON specials (valid_until);

-- Claims tracking indexes
CREATE INDEX idx_special_claims_special_id ON special_claims(special_id);
CREATE INDEX idx_special_claims_user_id ON special_claims(user_id);
CREATE INDEX idx_special_claims_guest_session_id ON special_claims(guest_session_id);
CREATE INDEX idx_special_claims_status ON special_claims(status);
CREATE INDEX idx_special_claims_claimed_at ON special_claims(claimed_at DESC);

-- Media indexes
CREATE INDEX idx_special_media_special_id ON special_media(special_id);
CREATE INDEX idx_special_media_position ON special_media(special_id, position);

-- Events indexes
CREATE INDEX idx_special_events_special_id ON special_events(special_id);
CREATE INDEX idx_special_events_user_id ON special_events(user_id);
CREATE INDEX idx_special_events_type_time ON special_events(special_id, event_type, occurred_at DESC);

-- =============================================================================
-- UNIQUE CONSTRAINTS AND BUSINESS RULES
-- =============================================================================

-- One featured special per business (optional - comment out if not needed)
CREATE UNIQUE INDEX one_featured_special_per_business
ON specials (business_id)
WHERE (is_enabled AND priority > 0 AND validity @> now());

-- Prevent overlapping active windows per business (optional)
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE specials
  ADD CONSTRAINT no_overlapping_specials_per_business
  EXCLUDE USING gist (
    business_id WITH =,
    validity    WITH &&
  ) WHERE (is_enabled);

-- One claim per user per special (unless per_visit is true)
CREATE UNIQUE INDEX uq_special_claim_user ON special_claims(special_id, user_id) 
    WHERE user_id IS NOT NULL AND status IN ('claimed', 'redeemed');

CREATE UNIQUE INDEX uq_special_claim_guest ON special_claims(special_id, guest_session_id) 
    WHERE guest_session_id IS NOT NULL AND status IN ('claimed', 'redeemed');

-- =============================================================================
-- RESTAURANT-ONLY CONSTRAINT (Trigger Approach)
-- =============================================================================

-- Function to ensure specials are only created for restaurants
CREATE OR REPLACE FUNCTION ensure_specials_target_is_restaurant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE 
    et_key VARCHAR(50);
BEGIN
    SELECT et.key INTO et_key 
    FROM entities e 
    JOIN entity_types et ON e.entity_type_id = et.id 
    WHERE e.id = NEW.business_id;
    
    IF et_key IS NULL THEN
        RAISE EXCEPTION 'Business entity not found for special';
    END IF;
    
    IF et_key <> 'restaurant' THEN
        RAISE EXCEPTION 'Specials allowed only for restaurants. Got: %', et_key;
    END IF;
    
    RETURN NEW;
END$$;

-- Create trigger to enforce restaurant-only constraint
CREATE TRIGGER trg_specials_entity_kind
BEFORE INSERT OR UPDATE ON specials
FOR EACH ROW EXECUTE FUNCTION ensure_specials_target_is_restaurant();

-- =============================================================================
-- COUNTER CACHE TRIGGERS
-- =============================================================================

-- Function to update claims counter cache
CREATE OR REPLACE FUNCTION update_specials_claims_counter()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment counter for new claims
        UPDATE specials 
        SET claims_total = claims_total + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.special_id;
        
        -- Log the claim event
        INSERT INTO special_events (special_id, user_id, guest_session_id, event_type, ip_address, user_agent)
        VALUES (NEW.special_id, NEW.user_id, NEW.guest_session_id, 'claim', NEW.ip_address, NEW.user_agent);
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes (e.g., redeemed, cancelled)
        IF OLD.status != NEW.status THEN
            -- Could add logic here for status-specific counter updates
            UPDATE specials 
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.special_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement counter for deleted claims
        UPDATE specials 
        SET claims_total = GREATEST(claims_total - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.special_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for claims counter updates
CREATE TRIGGER trigger_update_specials_claims_counter
    AFTER INSERT OR UPDATE OR DELETE ON special_claims
    FOR EACH ROW EXECUTE FUNCTION update_specials_claims_counter();

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE TRIGGER trigger_update_specials_updated_at
    BEFORE UPDATE ON specials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PERFORMANCE QUERIES (Ready-to-Use Functions)
-- =============================================================================

-- Function to get entities within radius with active specials
CREATE OR REPLACE FUNCTION get_restaurants_with_active_specials_within_radius(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    entity_id UUID,
    name VARCHAR(255),
    distance_meters DOUBLE PRECISION,
    active_specials_count INTEGER,
    top_special JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH restaurants_with_specials AS (
        SELECT 
            e.id,
            e.name,
            ST_Distance(
                e.location::geography,
                ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
            ) as distance,
            COUNT(s.id) as specials_count,
            (
                SELECT jsonb_build_object(
                    'id', s2.id,
                    'title', s2.title,
                    'discount_label', s2.discount_label,
                    'priority', s2.priority,
                    'valid_until', s2.valid_until
                )
                FROM specials s2
                WHERE s2.business_id = e.id
                  AND s2.is_enabled
                  AND s2.validity @> now()
                  AND (s2.max_claims_total IS NULL OR s2.claims_total < s2.max_claims_total)
                ORDER BY s2.priority DESC, s2.valid_until ASC
                LIMIT 1
            ) as top_special
        FROM entities e
        JOIN entity_types et ON e.entity_type_id = et.id
        LEFT JOIN specials s ON (
            s.business_id = e.id
            AND s.is_enabled
            AND s.validity @> now()
            AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
        )
        WHERE e.is_active = TRUE
          AND et.key = 'restaurant'
          AND e.location IS NOT NULL
          AND ST_DWithin(
              e.location::geography,
              ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
              radius_meters
          )
        GROUP BY e.id, e.name, e.location
        HAVING COUNT(s.id) > 0
    )
    SELECT 
        rws.id,
        rws.name,
        rws.distance,
        rws.specials_count,
        rws.top_special
    FROM restaurants_with_specials rws
    ORDER BY rws.distance
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get all active specials for a restaurant as JSON
CREATE OR REPLACE FUNCTION get_restaurant_active_specials_json(restaurant_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'subtitle', s.subtitle,
            'discount_label', s.discount_label,
            'discount_type', s.discount_type,
            'discount_value', s.discount_value,
            'valid_from', s.valid_from,
            'valid_until', s.valid_until,
            'priority', s.priority,
            'claims_total', s.claims_total,
            'max_claims_total', s.max_claims_total,
            'hero_image_url', s.hero_image_url,
            'terms', s.terms
        ) ORDER BY s.priority DESC, s.valid_until ASC
    )
    INTO result
    FROM specials s
    WHERE s.business_id = restaurant_id
      AND s.is_enabled
      AND s.validity @> now()
      AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total);
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

COMMIT;

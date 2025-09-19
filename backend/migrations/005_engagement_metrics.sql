-- Migration: Add engagement metrics to entities
-- Date: 2025-09-18
-- Description: Add view_count, like_count, and share_count to entities table

-- Add engagement count columns to entities table
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entities_view_count ON entities(view_count);
CREATE INDEX IF NOT EXISTS idx_entities_like_count ON entities(like_count);
CREATE INDEX IF NOT EXISTS idx_entities_share_count ON entities(share_count);

-- Create entity_interactions table to track user interactions
CREATE TABLE IF NOT EXISTS entity_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'like', 'share', 'favorite')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Ensure either user_id or guest_session_id is provided
    CONSTRAINT check_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR 
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    ),
    
    -- Prevent duplicate interactions (one per user/guest per entity per type)
    UNIQUE(entity_id, user_id, interaction_type),
    UNIQUE(entity_id, guest_session_id, interaction_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_interactions_entity_id ON entity_interactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_interactions_user_id ON entity_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_interactions_guest_session_id ON entity_interactions(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_entity_interactions_type ON entity_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_entity_interactions_created_at ON entity_interactions(created_at);

-- Function to update entity counts when interactions change
CREATE OR REPLACE FUNCTION update_entity_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment count for the interaction type
        IF NEW.interaction_type = 'view' THEN
            UPDATE entities SET view_count = COALESCE(view_count, 0) + 1 WHERE id = NEW.entity_id;
        ELSIF NEW.interaction_type = 'like' THEN
            UPDATE entities SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.entity_id;
        ELSIF NEW.interaction_type = 'share' THEN
            UPDATE entities SET share_count = COALESCE(share_count, 0) + 1 WHERE id = NEW.entity_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement count for the interaction type
        IF OLD.interaction_type = 'view' THEN
            UPDATE entities SET view_count = GREATEST(COALESCE(view_count, 0) - 1, 0) WHERE id = OLD.entity_id;
        ELSIF OLD.interaction_type = 'like' THEN
            UPDATE entities SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.entity_id;
        ELSIF OLD.interaction_type = 'share' THEN
            UPDATE entities SET share_count = GREATEST(COALESCE(share_count, 0) - 1, 0) WHERE id = OLD.entity_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update counts
DROP TRIGGER IF EXISTS trigger_update_entity_counts ON entity_interactions;
CREATE TRIGGER trigger_update_entity_counts
    AFTER INSERT OR DELETE ON entity_interactions
    FOR EACH ROW EXECUTE FUNCTION update_entity_counts();

-- Initialize counts for existing entities (set to random values for demo)
UPDATE entities SET 
    view_count = FLOOR(RANDOM() * 2000 + 100)::INTEGER,
    like_count = FLOOR(RANDOM() * 500 + 10)::INTEGER,
    share_count = FLOOR(RANDOM() * 100 + 5)::INTEGER
WHERE view_count IS NULL OR like_count IS NULL OR share_count IS NULL;

-- Add some sample interactions for demo
INSERT INTO entity_interactions (entity_id, guest_session_id, interaction_type, ip_address, user_agent)
SELECT 
    e.id,
    (SELECT id FROM guest_sessions ORDER BY created_at DESC LIMIT 1),
    'view',
    '127.0.0.1'::INET,
    'JewgoApp/1.0'
FROM entities e
WHERE e.entity_type = 'mikvah'
ON CONFLICT DO NOTHING;

COMMIT;

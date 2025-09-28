-- Migration: Fix specials guest session constraints
-- Date: 2025-01-19
-- Description: Add proper unique constraints for guest sessions in special_claims

-- Drop the existing unique constraint
DROP INDEX IF EXISTS uq_special_claim_once;

-- Create separate unique constraints for users and guests
-- For regular users
CREATE UNIQUE INDEX uq_special_claim_user ON special_claims(special_id, user_id) 
    WHERE user_id IS NOT NULL AND status IN ('claimed', 'redeemed');

-- For guest sessions
CREATE UNIQUE INDEX uq_special_claim_guest ON special_claims(special_id, guest_session_id) 
    WHERE guest_session_id IS NOT NULL AND status IN ('claimed', 'redeemed');

COMMIT;

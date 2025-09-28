-- Add missing fields to mikvahs and synagogues tables
-- This migration adds the missing fields that are needed for the new forms

-- Add missing fields to mikvahs table
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS has_accessibility BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS has_private_rooms BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS has_heating BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS has_air_conditioning BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS has_wifi BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS price_per_use DECIMAL(10, 2);
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS accepts_cash BOOLEAN DEFAULT TRUE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS accepts_credit BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS accepts_checks BOOLEAN DEFAULT FALSE;
ALTER TABLE mikvahs ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}';

-- Add missing fields to synagogues table
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS rabbi_name VARCHAR(255);
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS congregation_size VARCHAR(50);
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS has_kosher_kitchen BOOLEAN DEFAULT FALSE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS has_mikvah BOOLEAN DEFAULT FALSE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS has_library BOOLEAN DEFAULT FALSE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS has_youth_programs BOOLEAN DEFAULT FALSE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS has_adult_education BOOLEAN DEFAULT FALSE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS has_social_events BOOLEAN DEFAULT FALSE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS daily_minyan BOOLEAN DEFAULT FALSE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS shabbat_services BOOLEAN DEFAULT TRUE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS holiday_services BOOLEAN DEFAULT TRUE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS lifecycle_services BOOLEAN DEFAULT TRUE;
ALTER TABLE synagogues ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}';

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_mikvahs_has_parking ON mikvahs(has_parking);
CREATE INDEX IF NOT EXISTS idx_mikvahs_has_accessibility ON mikvahs(has_accessibility);
CREATE INDEX IF NOT EXISTS idx_mikvahs_has_private_rooms ON mikvahs(has_private_rooms);
CREATE INDEX IF NOT EXISTS idx_mikvahs_has_heating ON mikvahs(has_heating);
CREATE INDEX IF NOT EXISTS idx_mikvahs_has_air_conditioning ON mikvahs(has_air_conditioning);
CREATE INDEX IF NOT EXISTS idx_mikvahs_has_wifi ON mikvahs(has_wifi);
CREATE INDEX IF NOT EXISTS idx_mikvahs_price_per_use ON mikvahs(price_per_use);

CREATE INDEX IF NOT EXISTS idx_synagogues_rabbi_name ON synagogues(rabbi_name);
CREATE INDEX IF NOT EXISTS idx_synagogues_congregation_size ON synagogues(congregation_size);
CREATE INDEX IF NOT EXISTS idx_synagogues_has_kosher_kitchen ON synagogues(has_kosher_kitchen);
CREATE INDEX IF NOT EXISTS idx_synagogues_has_mikvah ON synagogues(has_mikvah);
CREATE INDEX IF NOT EXISTS idx_synagogues_has_library ON synagogues(has_library);
CREATE INDEX IF NOT EXISTS idx_synagogues_has_youth_programs ON synagogues(has_youth_programs);
CREATE INDEX IF NOT EXISTS idx_synagogues_has_adult_education ON synagogues(has_adult_education);
CREATE INDEX IF NOT EXISTS idx_synagogues_has_social_events ON synagogues(has_social_events);
CREATE INDEX IF NOT EXISTS idx_synagogues_daily_minyan ON synagogues(daily_minyan);
CREATE INDEX IF NOT EXISTS idx_synagogues_shabbat_services ON synagogues(shabbat_services);
CREATE INDEX IF NOT EXISTS idx_synagogues_holiday_services ON synagogues(holiday_services);
CREATE INDEX IF NOT EXISTS idx_synagogues_lifecycle_services ON synagogues(lifecycle_services);

COMMIT;

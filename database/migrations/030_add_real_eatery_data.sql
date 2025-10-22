-- Migration: Add Real Eatery Data
-- Date: 2025-01-19
-- Description: Insert real eatery data with proper normalization

BEGIN;

-- Insert into entities_normalized table
INSERT INTO entities_normalized (
  id,
  entity_type,
  name,
  description,
  address,
  city,
  state,
  zip_code,
  country,
  phone,
  website,
  latitude,
  longitude,
  rating,
  review_count,
  is_verified,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Dolci peccati gelato
(
  '00739e2d-e981-4388-bf31-7ccfbcfac9de',
  'restaurant',
  'Dolci peccati gelato',
  'Kosher dairy ice cream shop featuring restaurant frozen treats and desserts in miami.',
  '274 NE 59th Street',
  'Miami',
  'FL',
  '33137',
  'US',
  '954-632-8551',
  NULL,
  25.829594,
  -80.190433,
  0.0,
  19,
  true,
  true,
  '2025-10-09 22:05:21.570 -0400',
  '2025-10-09 22:05:21.570 -0400'
),

-- Dan the baking man
(
  '01292e7d-c717-4cab-bb96-3753e830d485',
  'restaurant',
  'Dan the baking man',
  'Kosher pareve restaurant offering bakery dishes and vegetarian-friendly options in aventura.',
  '7350 NE 2nd Ave #102',
  'Aventura',
  'FL',
  '33009',
  'US',
  '(305) 936-1440',
  'https://www.lerendezvousaventura.com/',
  25.985956,
  -80.146811,
  0.0,
  24,
  true,
  true,
  '2025-10-09 22:05:21.570 -0400',
  '2025-10-09 22:05:21.570 -0400'
),

-- Smash house burgers boca
(
  '0144096b-b91e-4c92-9a8b-1e159fabe13e',
  'restaurant',
  'Smash house burgers boca',
  'Kosher meat restaurant specializing in restaurant cuisine and grilled dishes in boca raton.',
  '21065 Powerline Rd, Suite C15',
  'Boca raton',
  'FL',
  '33433',
  'US',
  '(561) 367-3401',
  'http://www.smashhouseburgers.com/',
  26.362122,
  -80.153018,
  0.0,
  15,
  true,
  true,
  '2025-10-09 22:05:21.570 -0400',
  '2025-10-09 22:05:21.570 -0400'
),

-- Pita xpress
(
  '0173f84e-bfb3-425e-a42e-fe0188e82c06',
  'restaurant',
  'Pita xpress',
  'Kosher meat restaurant specializing in restaurant cuisine and grilled dishes in dania beach.',
  '2445 Stirling Rd',
  'Dania beach',
  'FL',
  '33312',
  'US',
  '(954) 251-1799',
  'https://www.pitaxpress.getsauce.com/',
  26.048048,
  -80.173431,
  0.0,
  25,
  true,
  true,
  '2025-10-09 22:05:21.570 -0400',
  '2025-10-09 22:05:21.570 -0400'
),

-- Bambu pan asian kitchen
(
  '023d9bad-f262-474e-9534-9f5e5adfc239',
  'restaurant',
  'Bambu pan asian kitchen',
  'Kosher meat restaurant specializing in restaurant cuisine and grilled dishes in north miami beach.',
  '3427 NE 163rd Street',
  'North miami beach',
  'FL',
  '33160',
  'US',
  '(786) 384-5177',
  'https://bambukosher.com/locations',
  25.929049,
  -80.136157,
  0.0,
  19,
  true,
  true,
  '2025-10-09 22:05:21.570 -0400',
  '2025-10-09 22:05:21.570 -0400'
),

-- Rave pizza & sushi
(
  '0310494c-35bf-4026-b1e5-f5424dd6fecd',
  'restaurant',
  'Rave pizza & sushi',
  'Kosher dairy pizzeria serving authentic restaurant pizza and italian dishes in boca raton.',
  '7300 West Camino Real',
  'Boca raton',
  'FL',
  '33433',
  'US',
  '(561) 408-7283',
  'http://www.raveboca.com/',
  26.343562,
  -80.155150,
  0.0,
  10,
  true,
  true,
  '2025-10-09 22:05:21.570 -0400',
  '2025-10-09 22:05:21.570 -0400'
);

-- Insert into restaurants_normalized table
INSERT INTO restaurants_normalized (
  entity_id,
  kosher_level,
  kosher_certification,
  cuisine_type,
  price_range,
  price_min,
  price_max,
  has_parking,
  has_wifi,
  has_delivery,
  has_takeout,
  has_dine_in,
  has_outdoor_seating,
  operating_hours
) VALUES 
-- Dolci peccati gelato (dairy, ORB certification)
(
  '00739e2d-e981-4388-bf31-7ccfbcfac9de',
  'dairy',
  'ORB',
  'Ice Cream',
  '$5-10',
  5.00,
  10.00,
  true,
  true,
  false,
  true,
  true,
  false,
  '{"monday": {"open": "10:00", "close": "22:00", "closed": false}, "tuesday": {"open": "10:00", "close": "22:00", "closed": false}, "wednesday": {"open": "10:00", "close": "22:00", "closed": false}, "thursday": {"open": "10:00", "close": "22:00", "closed": false}, "friday": {"open": "10:00", "close": "15:00", "closed": false}, "saturday": {"open": "20:00", "close": "23:00", "closed": false}, "sunday": {"open": "10:00", "close": "22:00", "closed": false}}'::jsonb
),

-- Dan the baking man (parve, ORB certification)
(
  '01292e7d-c717-4cab-bb96-3753e830d485',
  'parve',
  'ORB',
  'Bakery',
  '$10-20',
  10.00,
  20.00,
  true,
  true,
  true,
  true,
  true,
  true,
  '{"monday": {"open": "08:00", "close": "20:00", "closed": false}, "tuesday": {"open": "08:00", "close": "20:00", "closed": false}, "wednesday": {"open": "08:00", "close": "20:00", "closed": false}, "thursday": {"open": "08:00", "close": "20:00", "closed": false}, "friday": {"open": "08:00", "close": "14:00", "closed": false}, "saturday": {"open": "20:00", "close": "23:00", "closed": false}, "sunday": {"open": "08:00", "close": "20:00", "closed": false}}'::jsonb
),

-- Smash house burgers boca (meat, ORB certification)
(
  '0144096b-b91e-4c92-9a8b-1e159fabe13e',
  'meat',
  'ORB',
  'American',
  '$20-30',
  15.00,
  25.00,
  true,
  true,
  true,
  true,
  true,
  false,
  '{"monday": {"open": "11:00", "close": "23:00", "closed": false}, "tuesday": {"open": "11:00", "close": "23:00", "closed": false}, "wednesday": {"open": "11:00", "close": "23:00", "closed": false}, "thursday": {"open": "11:00", "close": "23:00", "closed": false}, "friday": {"open": "11:00", "close": "15:00", "closed": false}, "saturday": {"open": "21:30", "close": "00:00", "closed": false}, "sunday": {"open": "11:00", "close": "23:00", "closed": false}}'::jsonb
),

-- Pita xpress (meat, ORB certification)
(
  '0173f84e-bfb3-425e-a42e-fe0188e82c06',
  'meat',
  'ORB',
  'Middle Eastern',
  '$10-20',
  10.00,
  20.00,
  true,
  true,
  true,
  true,
  true,
  false,
  '{"monday": {"open": "11:00", "close": "21:45", "closed": false}, "tuesday": {"open": "11:00", "close": "21:45", "closed": false}, "wednesday": {"open": "11:00", "close": "21:45", "closed": false}, "thursday": {"open": "11:00", "close": "21:45", "closed": false}, "friday": {"open": "11:00", "close": "15:45", "closed": false}, "saturday": {"open": "20:00", "close": "23:00", "closed": false}, "sunday": {"open": "11:00", "close": "21:45", "closed": false}}'::jsonb
),

-- Bambu pan asian kitchen (meat, ORB certification)
(
  '023d9bad-f262-474e-9534-9f5e5adfc239',
  'meat',
  'ORB',
  'Asian',
  '$20-30',
  15.00,
  25.00,
  true,
  true,
  true,
  true,
  true,
  false,
  '{"monday": {"open": "12:00", "close": "22:00", "closed": false}, "tuesday": {"open": "12:00", "close": "22:00", "closed": false}, "wednesday": {"open": "12:00", "close": "22:00", "closed": false}, "thursday": {"open": "12:00", "close": "22:00", "closed": false}, "friday": {"open": "11:00", "close": "15:00", "closed": false}, "saturday": {"open": "20:00", "close": "23:00", "closed": false}, "sunday": {"open": "12:00", "close": "22:00", "closed": false}}'::jsonb
),

-- Rave pizza & sushi (dairy, ORB certification)
(
  '0310494c-35bf-4026-b1e5-f5424dd6fecd',
  'dairy',
  'ORB',
  'Italian/Japanese',
  '$20-30',
  15.00,
  25.00,
  true,
  true,
  true,
  true,
  true,
  false,
  '{"monday": {"open": "11:00", "close": "20:00", "closed": false}, "tuesday": {"open": "11:00", "close": "20:00", "closed": false}, "wednesday": {"open": "11:00", "close": "20:00", "closed": false}, "thursday": {"open": "11:00", "close": "21:00", "closed": false}, "friday": {"open": "11:00", "close": "15:00", "closed": false}, "saturday": {"open": "20:00", "close": "00:00", "closed": false}, "sunday": {"open": "11:00", "close": "20:00", "closed": false}}'::jsonb
);

COMMIT;

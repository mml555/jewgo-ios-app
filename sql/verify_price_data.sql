-- ============================================================================
-- Verify Eatery Price Data
-- ============================================================================
-- This script verifies that all restaurants have proper price data
-- ============================================================================

-- 1. Check all restaurants have price data
SELECT 
  'Total Restaurants' as check_name,
  COUNT(*) as count
FROM entities_normalized e
WHERE e.entity_type = 'restaurant';

-- 2. Check restaurants with price data
SELECT 
  'Restaurants with Price Data' as check_name,
  COUNT(*) as count
FROM entities_normalized e
JOIN restaurants_normalized rn ON e.id = rn.entity_id
WHERE e.entity_type = 'restaurant'
AND rn.price_min IS NOT NULL
AND rn.price_max IS NOT NULL;

-- 3. Check restaurants missing price data
SELECT 
  'Restaurants Missing Price Data' as check_name,
  COUNT(*) as count
FROM entities_normalized e
LEFT JOIN restaurants_normalized rn ON e.id = rn.entity_id
WHERE e.entity_type = 'restaurant'
AND (rn.price_min IS NULL OR rn.price_max IS NULL);

-- 4. View all restaurant prices
SELECT 
  e.name,
  e.city,
  e.state,
  rn.kosher_level,
  rn.price_min,
  rn.price_max,
  rn.price_range,
  CASE 
    WHEN rn.price_min IS NULL OR rn.price_max IS NULL THEN '❌ Missing'
    ELSE '✅ OK'
  END as status
FROM entities_normalized e
LEFT JOIN restaurants_normalized rn ON e.id = rn.entity_id
WHERE e.entity_type = 'restaurant'
ORDER BY rn.price_min NULLS LAST, e.name;

-- 5. Price range distribution
SELECT 
  rn.price_range,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM entities_normalized e
JOIN restaurants_normalized rn ON e.id = rn.entity_id
WHERE e.entity_type = 'restaurant'
AND rn.price_range IS NOT NULL
GROUP BY rn.price_range
ORDER BY 
  CASE rn.price_range
    WHEN '$5-10' THEN 1
    WHEN '$10-20' THEN 2
    WHEN '$20-30' THEN 3
    WHEN '$30-40' THEN 4
    WHEN '$40-50' THEN 5
    WHEN '$50-60' THEN 6
    WHEN '$60-70' THEN 7
    WHEN '$70-80' THEN 8
    WHEN '$80-90' THEN 9
    WHEN '$90-100' THEN 10
    WHEN '$100+' THEN 11
    ELSE 99
  END;

-- 6. Test the full API query
SELECT 
  e.id,
  e.name,
  e.description,
  e.city,
  e.state,
  e.rating,
  e.review_count,
  rn.kosher_level,
  rn.kosher_certification,
  rn.price_min,
  rn.price_max,
  rn.price_range
FROM entities_normalized e
LEFT JOIN restaurants_normalized rn ON e.id = rn.entity_id
WHERE e.entity_type = 'restaurant'
AND e.is_active = true
ORDER BY e.name
LIMIT 5;

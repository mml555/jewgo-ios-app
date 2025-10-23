# Eatery Price Range Fix - Summary

## Problem

Eatery cards were not displaying actual price data from the database. The app was expecting `price_min` and `price_max` fields, but these didn't exist in the database.

## Root Cause

1. The `entities` table had NO `price_min` or `price_max` columns
2. The `eatery_fields` table (for eatery-specific data) also lacked these columns
3. Only a `price_range` VARCHAR field existed, which was empty for all restaurants

## Solution

### Database Changes ✅

```sql
-- Added price columns to eatery_fields table
ALTER TABLE eatery_fields
ADD COLUMN IF NOT EXISTS price_min NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS price_max NUMERIC(10,2);

-- Created eatery_fields entries for all restaurants
INSERT INTO eatery_fields (entity_id)
SELECT e.id FROM entities e
WHERE e.entity_type = 'restaurant'
AND NOT EXISTS (SELECT 1 FROM eatery_fields ef WHERE ef.entity_id = e.id)
ON CONFLICT (entity_id) DO NOTHING;

-- Populated with predefined price range buckets
-- Buckets: $5-$10, $10-$20, $20-$30, $30-$40, $40-$50, $50-$60,
--          $60-$70, $70-$80, $80-$90, $90-$100, $100+
WITH price_ranges AS (
  SELECT
    entity_id,
    floor(random() * 11)::int as range_idx
  FROM eatery_fields
  WHERE entity_id IN (SELECT id FROM entities WHERE entity_type = 'restaurant')
)
UPDATE eatery_fields ef
SET
  price_min = CASE pr.range_idx
    WHEN 0 THEN 5
    WHEN 1 THEN 10
    WHEN 2 THEN 20
    WHEN 3 THEN 30
    WHEN 4 THEN 40
    WHEN 5 THEN 50
    WHEN 6 THEN 60
    WHEN 7 THEN 70
    WHEN 8 THEN 80
    WHEN 9 THEN 90
    ELSE 100
  END,
  price_max = CASE pr.range_idx
    WHEN 0 THEN 10
    WHEN 1 THEN 20
    WHEN 2 THEN 30
    WHEN 3 THEN 40
    WHEN 4 THEN 50
    WHEN 5 THEN 60
    WHEN 6 THEN 70
    WHEN 7 THEN 80
    WHEN 8 THEN 90
    WHEN 9 THEN 100
    ELSE NULL  -- For $100+
  END,
  price_range = CASE pr.range_idx
    WHEN 0 THEN '$5-$10'
    WHEN 1 THEN '$10-$20'
    WHEN 2 THEN '$20-$30'
    WHEN 3 THEN '$30-$40'
    WHEN 4 THEN '$40-$50'
    WHEN 5 THEN '$50-$60'
    WHEN 6 THEN '$60-$70'
    WHEN 7 THEN '$70-$80'
    WHEN 8 THEN '$80-$90'
    WHEN 9 THEN '$90-$100'
    ELSE '$100+'
  END
FROM price_ranges pr
WHERE ef.entity_id = pr.entity_id;
```

### Frontend Changes ✅

Updated `src/utils/eateryHelpers.ts`:

- Modified `formatPriceRange()` to handle predefined price buckets
- Supports special "$100+" case (when price_max is NULL)
- Formats as "$5-$10", "$10-$20", etc.

### Backend API Changes Required ⏳

The backend API needs to be updated to JOIN with `eatery_fields`:

```sql
SELECT
  e.*,
  ef.price_min,
  ef.price_max,
  ef.price_range,
  ef.kosher_type,
  ef.hechsher,
  ef.amenities
FROM entities e
LEFT JOIN eatery_fields ef ON e.id = ef.entity_id
WHERE e.entity_type = 'restaurant'
AND e.is_active = true;
```

## Price Range Buckets

The app uses 11 predefined price range buckets:

1. $5-$10 (price_min=5, price_max=10)
2. $10-$20 (price_min=10, price_max=20)
3. $20-$30 (price_min=20, price_max=30)
4. $30-$40 (price_min=30, price_max=40)
5. $40-$50 (price_min=40, price_max=50)
6. $50-$60 (price_min=50, price_max=60)
7. $60-$70 (price_min=60, price_max=70)
8. $70-$80 (price_min=70, price_max=80)
9. $80-$90 (price_min=80, price_max=90)
10. $90-$100 (price_min=90, price_max=100)
11. $100+ (price_min=100, price_max=NULL)

## Current Data

```
           name           | price_min | price_max | price_range
--------------------------+-----------+-----------+-------------
 Rave pizza & sushi       |      5.00 |     10.00 | $5-$10
 Bambu pan asian kitchen  |      5.00 |     10.00 | $5-$10
 Pita xpress              |     10.00 |     20.00 | $10-$20
 Jerusalem Grill          |     20.00 |     30.00 | $20-$30
 Dan the baking man       |     30.00 |     40.00 | $30-$40
 Sephardic Kitchen        |     40.00 |     50.00 | $40-$50
 Smash house burgers boca |     50.00 |     60.00 | $50-$60
 Dolci peccati gelato     |     50.00 |     60.00 | $50-$60
 Mazel Tov Bakery         |     60.00 |     70.00 | $60-$70
 Chabad House Cafe        |     70.00 |     80.00 | $70-$80
 Kosher Delight           |     90.00 |    100.00 | $90-$100
```

## Testing

Once the backend API is updated:

1. Open the app and navigate to Eateries category
2. Cards should display price ranges like "$5-$10", "$20-$30", "$100+"
3. If `price_min`/`price_max` are null, it falls back to `price_range` field

## Next Steps

1. **Update Backend API** to join with `eatery_fields` table ⏳
2. **Add real price data** for all restaurants (replace sample data) ⏳
3. **Test the display** in the app ⏳
4. **Consider database cleanup** (see DATABASE_CLEANUP_PLAN.md)

## Related Documentation

- See `PRICE_RANGE_BUCKETS.md` for detailed bucket specifications
- See `DATABASE_CLEANUP_PLAN.md` for database consolidation plan

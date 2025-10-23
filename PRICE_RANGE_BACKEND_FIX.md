# Price Range Backend Fix - Complete

## Issue

The backend was querying `price_range` from the wrong table (`restaurants_normalized`) instead of the correct source table (`eatery_fields`).

## Changes Made

### 1. Updated Main Query JOIN (Line 28-58)

**File:** `backend/src/controllers/EntityControllerNormalized.js`

Added JOIN with `eatery_fields` table:

```javascript
FROM entities_normalized e
LEFT JOIN restaurants_normalized r ON e.id = r.entity_id
LEFT JOIN eatery_fields ef ON e.id = ef.entity_id  // NEW
LEFT JOIN users u ON e.owner_id = u.id
```

Changed SELECT fields to use `eatery_fields`:

```javascript
ef.price_min,    // Changed from r.price_min
ef.price_max,    // Changed from r.price_max
ef.price_range,  // Changed from r.price_range
```

### 2. Updated Price Filters (Line 112-125)

Changed filter conditions to reference `eatery_fields`:

```javascript
// Before:
query += ` AND r.price_min >= $${paramCount}`;
query += ` AND r.price_max <= $${paramCount}`;

// After:
query += ` AND ef.price_min >= $${paramCount}`;
query += ` AND ef.price_max <= $${paramCount}`;
```

### 3. Updated getSpecializedData Method (Line 308-325)

Enhanced the restaurant case to include `eatery_fields` data:

```javascript
case 'restaurant':
  specializedQuery = `
    SELECT
      r.*,
      ef.price_min,
      ef.price_max,
      ef.price_range,
      ef.kosher_type,
      ef.hechsher,
      ef.kosher_tags,
      ef.short_description,
      ef.amenities
    FROM restaurants_normalized r
    LEFT JOIN eatery_fields ef ON r.entity_id = ef.entity_id
    WHERE r.entity_id = $1
  `;
  break;
```

## Data Flow

### Database Tables

```
entities_normalized (e)
  ├── restaurants_normalized (r) - kosher_level, kosher_certification
  └── eatery_fields (ef) - price_min, price_max, price_range ✅
```

### API Response

```javascript
{
  id: "...",
  name: "Restaurant Name",
  price_min: 10,        // From eatery_fields
  price_max: 20,        // From eatery_fields
  price_range: "$10-20" // From eatery_fields ✅
}
```

### Frontend Display

```javascript
// CategoryCard.tsx
const formatted = formatPriceRange(item.price_min, item.price_max);
return formatted || item.price_range || '';

// ListingDetailScreen.tsx
<Text>{item.price_range || '$'}</Text>;
```

## Testing Required

1. **Verify API Response:**

   ```bash
   curl http://localhost:3000/api/v5/restaurants
   ```

   Check that `price_range` field is populated correctly.

2. **Test Frontend Display:**

   - Open eatery category
   - Verify price ranges display on cards
   - Open eatery detail page
   - Verify price range displays correctly

3. **Test Price Filters:**
   - Apply price range filters
   - Verify results are filtered correctly

## Database Requirements

Ensure `eatery_fields` table has data:

```sql
-- Check if eatery_fields has price data
SELECT
  e.name,
  ef.price_min,
  ef.price_max,
  ef.price_range
FROM entities e
JOIN eatery_fields ef ON e.id = ef.entity_id
WHERE e.entity_type = 'restaurant'
LIMIT 10;
```

If no data, run the price range update script:

```bash
psql -d jewgo_db -f sql/update_price_ranges.sql
```

## Status

✅ Backend controller updated
✅ All price references now use `eatery_fields` table
✅ Specialized data method enhanced
⏳ Requires testing with live data

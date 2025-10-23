# Eatery Price Range Implementation Guide

## Overview

This document describes the complete implementation of price ranges for eatery listings in the JEWGO app.

## Price Range System

### Predefined Buckets

The app uses 11 predefined price range buckets based on average meal cost:

| Display  | price_min | price_max | Description          |
| -------- | --------- | --------- | -------------------- |
| $5-$10   | 5         | 10        | Very budget-friendly |
| $10-$20  | 10        | 20        | Budget-friendly      |
| $20-$30  | 20        | 30        | Moderate             |
| $30-$40  | 30        | 40        | Moderate-high        |
| $40-$50  | 40        | 50        | Mid-range            |
| $50-$60  | 50        | 60        | Mid-range to upscale |
| $60-$70  | 60        | 70        | Upscale              |
| $70-$80  | 70        | 80        | High-end             |
| $80-$90  | 80        | 90        | Very high-end        |
| $90-$100 | 90        | 100       | Premium              |
| $100+    | 100       | NULL      | Ultra-premium        |

## Database Schema

### Tables Involved

#### entities table

```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  entity_type entity_type NOT NULL,  -- 'restaurant' for eateries
  name VARCHAR(255) NOT NULL,
  -- ... other common fields
);
```

#### eatery_fields table

```sql
CREATE TABLE eatery_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL UNIQUE REFERENCES entities(id) ON DELETE CASCADE,

  -- Price range fields
  price_min NUMERIC(10,2),      -- Minimum price in the range
  price_max NUMERIC(10,2),      -- Maximum price (NULL for $100+)
  price_range VARCHAR(20),      -- Display string (e.g., "$10-$20")

  -- Other eatery-specific fields
  kosher_type VARCHAR(50),
  hechsher VARCHAR(100),
  kosher_tags TEXT[],
  amenities JSONB,
  -- ...
);
```

### Indexes

```sql
CREATE INDEX idx_eatery_fields_entity_id ON eatery_fields(entity_id);
CREATE INDEX idx_eatery_fields_kosher_type ON eatery_fields(kosher_type);
```

## Backend Implementation

### API Query

The backend must JOIN with `eatery_fields` when querying restaurants:

```sql
SELECT
  e.id,
  e.name,
  e.description,
  e.long_description,
  e.address,
  e.city,
  e.state,
  e.zip_code,
  e.phone,
  e.email,
  e.website,
  e.latitude,
  e.longitude,
  e.rating,
  e.review_count,
  e.is_verified,
  e.is_active,
  e.kosher_level,           -- Dietary type: 'meat', 'dairy', 'parve'
  e.kosher_certification,   -- Hechsher: 'OU', 'OK', 'KM', etc.

  -- Eatery-specific fields from JOIN
  ef.price_min,
  ef.price_max,
  ef.price_range,
  ef.kosher_type,
  ef.hechsher,
  ef.amenities,
  ef.google_reviews_link,
  ef.hours_json,
  ef.business_images

FROM entities e
LEFT JOIN eatery_fields ef ON e.id = ef.entity_id
WHERE e.entity_type = 'restaurant'
  AND e.is_active = true
ORDER BY e.rating DESC, e.review_count DESC;
```

### API Response Format

```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "id": "b2c2cd90-7d22-40bf-9ada-3becf7b42bd4",
        "title": "Kosher Delight",
        "description": "Authentic kosher cuisine",
        "category_id": "restaurant",
        "category_name": "Eatery",
        "address": "123 Main St",
        "city": "Brooklyn",
        "state": "NY",
        "zip_code": "11201",
        "latitude": 40.7128,
        "longitude": -74.006,
        "rating": "4.5",
        "review_count": 42,
        "kosher_level": "meat",
        "kosher_certification": "OU",
        "price_min": 20,
        "price_max": 30,
        "price_range": "$20-$30",
        "images": ["https://..."]
      }
    ]
  }
}
```

## Frontend Implementation

### TypeScript Interfaces

#### CategoryItem (src/hooks/useCategoryData.ts)

```typescript
export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  rating?: number;

  // Eatery-specific fields
  kosher_level?: 'meat' | 'dairy' | 'parve';
  kosher_certification?: string;
  price_min?: number;
  price_max?: number;
  price_range?: string;

  // ... other fields
}
```

#### Listing (src/services/api.ts)

```typescript
export interface Listing {
  id: string;
  title: string;
  // ... common fields

  // Eatery-specific fields
  kosher_level?: 'meat' | 'dairy' | 'parve';
  kosher_certification?: string;
  price_min?: number;
  price_max?: number;
  price_range?: string;
}
```

### Helper Function (src/utils/eateryHelpers.ts)

```typescript
/**
 * Format price range from min/max values
 * Supports predefined price buckets
 */
export function formatPriceRange(
  priceMin?: number,
  priceMax?: number,
): string | null {
  const hasMin = typeof priceMin === 'number' && priceMin > 0;
  const hasMax = typeof priceMax === 'number' && priceMax > 0;

  if (!hasMin && !hasMax) return null;

  const formatPrice = (price: number): string => {
    const amount = Number.isInteger(price) ? `${price}` : `${price.toFixed(0)}`;
    return `$${amount}`;
  };

  // Special case: $100+
  if (hasMin && priceMin >= 100 && !hasMax) {
    return '$100+';
  }

  if (hasMin && hasMax) {
    if (priceMin === priceMax) {
      return formatPrice(priceMin);
    }
    return `${formatPrice(priceMin)}-${formatPrice(priceMax)}`;
  }

  const price = hasMin ? priceMin! : priceMax!;
  return formatPrice(price);
}
```

### Usage in CategoryCard (src/components/CategoryCard.tsx)

```typescript
<Text style={styles.priceText}>
  {(() => {
    if (categoryKey === 'eatery') {
      // Try to format from price_min/price_max
      const formatted = formatPriceRange(item.price_min, item.price_max);

      // Fall back to price_range string if no min/max
      return formatted || item.price_range || '';
    }
    return String(item.price || '');
  })()}
</Text>
```

## Data Management

### Adding a New Restaurant

```sql
-- 1. Insert the restaurant entity
INSERT INTO entities (
  name,
  entity_type,
  description,
  address,
  city,
  state,
  zip_code,
  latitude,
  longitude,
  kosher_level,
  kosher_certification
)
VALUES (
  'New Kosher Restaurant',
  'restaurant',
  'Delicious kosher food',
  '456 Oak Ave',
  'Brooklyn',
  'NY',
  '11201',
  40.7128,
  -74.0060,
  'meat',
  'OU'
)
RETURNING id;

-- 2. Insert eatery-specific fields
INSERT INTO eatery_fields (
  entity_id,
  price_min,
  price_max,
  price_range,
  kosher_type,
  hechsher
)
VALUES (
  '<entity_id_from_above>',
  20,           -- $20
  30,           -- $30
  '$20-$30',
  'meat',
  'OU'
);
```

### Updating Price Range

```sql
-- Update to $40-$50 range
UPDATE eatery_fields
SET
  price_min = 40,
  price_max = 50,
  price_range = '$40-$50'
WHERE entity_id = '<entity_id>';

-- Update to $100+ range
UPDATE eatery_fields
SET
  price_min = 100,
  price_max = NULL,
  price_range = '$100+'
WHERE entity_id = '<entity_id>';
```

## Form Implementation

### Add/Edit Restaurant Form

When creating a form for adding or editing restaurants, use a dropdown/picker:

```typescript
const PRICE_RANGES = [
  { label: '$5-$10', min: 5, max: 10 },
  { label: '$10-$20', min: 10, max: 20 },
  { label: '$20-$30', min: 20, max: 30 },
  { label: '$30-$40', min: 30, max: 40 },
  { label: '$40-$50', min: 40, max: 50 },
  { label: '$50-$60', min: 50, max: 60 },
  { label: '$60-$70', min: 60, max: 70 },
  { label: '$70-$80', min: 70, max: 80 },
  { label: '$80-$90', min: 80, max: 90 },
  { label: '$90-$100', min: 90, max: 100 },
  { label: '$100+', min: 100, max: null },
];

// In the form component
<Picker
  selectedValue={selectedPriceRange}
  onValueChange={value => setSelectedPriceRange(value)}
>
  {PRICE_RANGES.map((range, index) => (
    <Picker.Item key={index} label={range.label} value={index} />
  ))}
</Picker>;
```

## Testing

### Manual Testing Checklist

- [ ] Navigate to Eateries category
- [ ] Verify price ranges display correctly on cards
- [ ] Check various price ranges ($5-$10, $20-$30, $100+)
- [ ] Verify fallback to `price_range` field when min/max are null
- [ ] Test on different screen sizes (iPhone, iPad)
- [ ] Verify price display in detail view

### Test Data

```sql
-- View current price distribution
SELECT
  ef.price_range,
  COUNT(*) as count
FROM entities e
JOIN eatery_fields ef ON e.id = ef.entity_id
WHERE e.entity_type = 'restaurant'
GROUP BY ef.price_range
ORDER BY ef.price_min;
```

## Troubleshooting

### Price not displaying

1. Check if `eatery_fields` entry exists for the restaurant
2. Verify `price_min` and `price_max` are set
3. Check backend API is joining with `eatery_fields`
4. Verify API response includes price fields

### Incorrect price format

1. Ensure `formatPriceRange()` is being called
2. Check that price values are numbers, not strings
3. Verify the $100+ case (price_max should be NULL)

## Related Files

- `sql/update_price_ranges.sql` - SQL script for updating prices
- `PRICE_RANGE_BUCKETS.md` - Detailed bucket specifications
- `PRICE_RANGE_FIX_SUMMARY.md` - Implementation summary
- `DATABASE_CLEANUP_PLAN.md` - Database consolidation plan

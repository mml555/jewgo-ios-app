# Eatery Price Range Buckets

## Predefined Price Ranges

The app uses predefined price range buckets for eateries:

| Bucket | price_min | price_max | price_range | Display  |
| ------ | --------- | --------- | ----------- | -------- |
| 1      | 5         | 10        | $5-$10      | $5-$10   |
| 2      | 10        | 20        | $10-$20     | $10-$20  |
| 3      | 20        | 30        | $20-$30     | $20-$30  |
| 4      | 30        | 40        | $30-$40     | $30-$40  |
| 5      | 40        | 50        | $40-$50     | $40-$50  |
| 6      | 50        | 60        | $50-$60     | $50-$60  |
| 7      | 60        | 70        | $60-$70     | $60-$70  |
| 8      | 70        | 80        | $70-$80     | $70-$80  |
| 9      | 80        | 90        | $80-$90     | $80-$90  |
| 10     | 90        | 100       | $90-$100    | $90-$100 |
| 11     | 100       | NULL      | $100+       | $100+    |

## Database Schema

### eatery_fields table

```sql
CREATE TABLE eatery_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
  price_min NUMERIC(10,2),  -- Minimum price in the range
  price_max NUMERIC(10,2),  -- Maximum price (NULL for $100+)
  price_range VARCHAR(20),  -- Display string (e.g., "$10-$20")
  -- ... other eatery fields
);
```

## Current Data Sample

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

## Frontend Implementation

### formatPriceRange() Function

Located in `src/utils/eateryHelpers.ts`:

```typescript
export function formatPriceRange(
  priceMin?: number,
  priceMax?: number,
): string | null {
  const hasMin = typeof priceMin === 'number' && priceMin > 0;
  const hasMax = typeof priceMax === 'number' && priceMax > 0;

  if (!hasMin && !hasMax) return null;

  // Special case: $100+ (when min is 100 and max is null)
  if (hasMin && priceMin >= 100 && !hasMax) {
    return '$100+';
  }

  // Format as "$10-$20"
  if (hasMin && hasMax) {
    return `$${priceMin}-$${priceMax}`;
  }

  // Fallback
  const price = hasMin ? priceMin! : priceMax!;
  return `$${price}`;
}
```

### Usage in CategoryCard

```typescript
<Text style={styles.priceText}>
  {(() => {
    if (categoryKey === 'eatery') {
      const formatted = formatPriceRange(item.price_min, item.price_max);
      return formatted || item.price_range || '';
    }
    return String(item.price || '');
  })()}
</Text>
```

## Backend API Requirements

The backend must JOIN with `eatery_fields` when querying restaurants:

```sql
SELECT
  e.id,
  e.name,
  e.description,
  e.address,
  e.city,
  e.state,
  e.zip_code,
  e.latitude,
  e.longitude,
  e.rating,
  e.review_count,
  e.kosher_level,
  e.kosher_certification,
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

## Adding New Restaurants

When adding a new restaurant, ensure the price range is set correctly:

```sql
-- Insert the restaurant entity
INSERT INTO entities (name, entity_type, address, city, state, zip_code, ...)
VALUES ('New Restaurant', 'restaurant', '123 Main St', 'Brooklyn', 'NY', '11201', ...)
RETURNING id;

-- Insert eatery-specific fields with price range
INSERT INTO eatery_fields (entity_id, price_min, price_max, price_range)
VALUES (
  '<entity_id>',
  20,      -- $20
  30,      -- $30
  '$20-$30'
);
```

## Form Validation

When creating a form for adding/editing restaurants, use a dropdown with these options:

- $5-$10
- $10-$20
- $20-$30
- $30-$40
- $40-$50
- $50-$60
- $60-$70
- $70-$80
- $80-$90
- $90-$100
- $100+

The form should set all three fields (price_min, price_max, price_range) based on the selection.

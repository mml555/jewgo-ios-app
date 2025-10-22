# Eatery Kosher Level Display Fix

## Problem
Eatery cards were showing the generic word "Kosher" in the tag instead of the actual kosher level (dietary type: meat, dairy, or parve) from the database.

## Root Cause
The `kosher_level` field from the backend was not being passed through in the data transformation pipeline:

1. Backend returns `kosher_level` with values: 'meat', 'dairy', or 'parve'
2. The `transformEntityToLegacyListing` function in `api.ts` was only using `kosher_level` to create `kosher_certifications` but not passing it through as a direct field
3. The `CategoryItem` interface was missing the `kosher_level` field definition
4. CategoryCard was checking for `item.kosher_level` but it was always undefined

## Solution

### 1. Updated `CategoryItem` interface in `src/hooks/useCategoryData.ts`
Added eatery-specific fields to match the API response:
```typescript
// Eateries-specific fields (snake_case from API)
kosher_level?: 'meat' | 'dairy' | 'parve'; // Dietary type for eateries
kosher_certification?: string; // Hechsher certification
price_min?: number;
price_max?: number;
price_range?: string;
```

### 2. Updated `transformEntityToLegacyListing` in `src/services/api.ts`
Added pass-through of eatery-specific fields:
```typescript
// Eateries-specific fields (pass through from backend)
kosher_level: entity.kosher_level, // Dietary type: 'meat' | 'dairy' | 'parve'
kosher_certification: entity.kosher_certification,
price_min: entity.price_min,
price_max: entity.price_max,
price_range: entity.price_range,
```

## Result
- Eatery cards now display the correct dietary type (Meat, Dairy, or Parve) in the top-left tag
- The `getDietaryLabel()` helper function properly formats the display text
- The dietary chip at the bottom-left also displays correctly with the appropriate color
- Data flows correctly from backend → API transformation → CategoryItem → CategoryCard

## Data Flow
```
Backend (kosher_level: 'meat')
  ↓
api.ts transformEntityToLegacyListing (passes through kosher_level)
  ↓
Listing/DetailedListing interface (kosher_level field)
  ↓
CategoryItem interface (kosher_level field)
  ↓
CategoryCard component (displays getDietaryLabel(item.kosher_level))
  ↓
User sees: "Meat" tag
```

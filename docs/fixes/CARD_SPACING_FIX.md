# Card Spacing Fix

## Problem

Cards in the grid were too small, causing uneven spacing between cards and page edges.

## Root Cause

The `getGridCardDimensions` function was doubling the horizontal padding by multiplying by 2, which reduced the available width for cards more than intended.

## Solution

### 1. Updated `getGridCardDimensions` in `src/utils/deviceAdaptation.ts`

- Changed padding calculation to use total horizontal padding (both sides combined) instead of doubling it
- Added debug logging to help troubleshoot spacing issues
- Formula: `availableWidth = screenWidth - horizontalPadding` (instead of `horizontalPadding * 2`)

### 2. Updated padding values across components

Changed from per-side padding to total padding:

- **Mobile phones**: 32px total (16px each side), 12px gap between cards
- **Tablets**: 48px total (24px each side), 24px gap between cards

### 3. Updated components

- `src/components/CategoryCard.tsx` - Updated grid dimension calculations
- `src/screens/CategoryGridScreen.tsx` - Updated grid dimension calculations and row styles
- `src/screens/HomeScreen.tsx` - Updated grid dimension calculations

### 4. Updated row styles in CategoryGridScreen

```typescript
row: {
  justifyContent: 'space-between',
  paddingHorizontal: 16, // 16px on each side = 32px total
  marginBottom: 12, // Gap between rows
},
rowMultiColumn: {
  justifyContent: 'space-between',
  paddingHorizontal: 24, // 24px on each side = 48px total for tablets
  marginBottom: 24, // Larger gap between rows on tablets
},
```

## Result

- Cards are now properly sized to fill the available width
- Even spacing between cards and page edges
- Consistent spacing across all screen sizes
- Better visual balance in the grid layout

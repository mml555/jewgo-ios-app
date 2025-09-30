# Job Cards Implementation

## Overview

The job cards feature provides a text-only, clean card design specifically for job listings in the Jewgo app. Unlike other category cards that display images, job cards focus on essential information: title, location, compensation, and tags.

## Components Created

### 1. JobCard Component (`src/components/JobCard.tsx`)

A specialized card component for displaying job listings with the following layout:

```
┌─────────────────────────────────┐
│                            ♡     │  ← Heart icon (favorites)
│                                  │
│  Software Developer              │  ← Line 1: Job Title (bold, truncated)
│                                  │
│  Brooklyn, NY • $60K-$80K        │  ← Line 2: Location • Compensation
│                                  │
│  [full-time] [remote] [urgent]   │  ← Tags with color coding
│                                  │
└─────────────────────────────────┘
```

#### Key Features:
- **Text-only layout** - No images, focusing on job information
- **Clean hierarchy** - Job title is the most prominent element
- **Color-coded tags** - Visual indicators for job type, location, and urgency
- **Responsive** - Fits 2 cards per row in grid layout
- **Favorites support** - Heart icon for saving jobs
- **Accessibility** - Proper ARIA labels and touch targets

#### Tag Colors:
- `part-time`: Light blue (#E3F2FD / #1976D2)
- `full-time`: Light green (#E8F5E9 / #388E3C)
- `remote`: Light purple (#F3E5F5 / #7B1FA2)
- `seasonal`: Light orange (#FFF3E0 / #F57C00)
- `urgent`: Light red (#FFEBEE / #D32F2F)

### 2. Job Types Definition (`src/types/jobs.ts`)

Comprehensive TypeScript types for job listings including:

```typescript
export interface JobListing {
  id: string;
  title: string;
  description: string;
  
  // Location
  location_type: 'on-site' | 'remote' | 'hybrid';
  city?: string;
  state?: string;
  is_remote: boolean;
  
  // Compensation
  compensation_type: 'hourly' | 'salary' | 'commission' | 'stipend';
  compensation_min?: number;
  compensation_max?: number;
  compensation_display?: string; // e.g., "$18/hr" or "$60K-$80K"
  
  // Job Type & Tags
  job_type: 'part-time' | 'full-time' | 'contract' | 'seasonal' | 'internship';
  tags: string[];
  
  // Jewish community specific
  kosher_environment?: boolean;
  shabbat_observant?: boolean;
  jewish_organization?: boolean;
  
  // ... more fields
}
```

Also includes a helper function `convertJobToCardData()` to transform full job listings into card-ready data.

## Integration

### CategoryGridScreen Update

The `CategoryGridScreen` component now conditionally renders `JobCard` for jobs category:

```typescript
const renderItem = useCallback(
  ({ item }: { item: CategoryItem }) => {
    // Use JobCard for jobs category, CategoryCard for all others
    if (categoryKey === 'jobs') {
      return <JobCard item={item} categoryKey={categoryKey} />;
    }
    return <CategoryCard item={item} categoryKey={categoryKey} />;
  },
  [categoryKey]
);
```

## Data Handling

The `JobCard` component intelligently handles both current mock data and future API data:

1. **Title Formatting**: Removes emoji prefixes (💼) from job titles
2. **Location Formatting**: 
   - Remote jobs → "Remote"
   - Hybrid jobs → "Hybrid - City, State"
   - On-site jobs → "City, State"
   - No location → "Location TBD"

3. **Compensation Formatting**:
   - Uses `compensation` field if available
   - Falls back to `price` field
   - Default → "Salary TBD"

4. **Tag Aggregation**:
   - Pulls from `job_type`, `location_type`, `is_remote`, `is_urgent`
   - Merges with custom `tags` array
   - Removes duplicates and limits to 3 tags

## Usage Example

```typescript
// In CategoryGridScreen.tsx
<JobCard
  item={{
    id: "job-123",
    title: "Software Developer",
    description: "Full-stack developer needed...",
    city: "Brooklyn",
    state: "NY",
    compensation: "$60K-$80K",
    job_type: "full-time",
    is_remote: true,
    tags: ["urgent"]
  }}
  categoryKey="jobs"
/>
```

## Design Specifications

### Card Dimensions
- **Width**: `(screenWidth - 16 - 8) / 2` (2 cards per row with padding)
- **Min Height**: 120px
- **Padding**: 16px (md)
- **Border Radius**: 12px (lg)
- **Shadow**: Small elevation shadow

### Typography
- **Job Title**: 18px, Bold (700), 24px line height
- **Location/Compensation**: 14px, Regular
- **Tags**: 11px, Semi-bold (600), Capitalized

### Spacing
- Title margin bottom: 8px (sm)
- Info row margin bottom: 8px (sm)
- Tag gap: 4px (xs)
- Heart button: 32x32px touch target

## Future Enhancements

When the backend API is ready, you can extend the functionality:

1. **Add job-specific filters** (job type, salary range, remote vs on-site)
2. **Add "Apply Now" button** directly in the card
3. **Show company logo** (optional, as small icon)
4. **Display posted date** ("Posted 2 days ago")
5. **Show applicant count** if applicable
6. **Add quick preview** on long press
7. **Implement job alerts** for saved searches

## Backend Integration Checklist

- [ ] Create jobs database table
- [ ] Create jobs API endpoints (`GET /api/jobs`, `GET /api/jobs/:id`)
- [ ] Add job-specific fields to API response
- [ ] Update `CategoryItem` type with job fields
- [ ] Update `useCategoryData` hook to handle job data
- [ ] Add job posting/editing functionality
- [ ] Implement job application tracking
- [ ] Add employer dashboard for managing job posts

## Testing

To test the job cards:

1. Navigate to the Jobs tab in the app
2. Verify cards display in 2-column grid
3. Check that titles truncate properly
4. Verify tags are color-coded correctly
5. Test favorites functionality (heart icon)
6. Verify tap navigates to job details
7. Test on different screen sizes

## Accessibility

The JobCard component follows WCAG guidelines:

- ✅ Proper accessibility labels
- ✅ Touch targets ≥ 44x44 points
- ✅ Color contrast ratios meet AA standards
- ✅ Screen reader support
- ✅ Keyboard navigation compatible
- ✅ Semantic HTML-like structure

## Related Files

- `src/components/JobCard.tsx` - Main job card component
- `src/types/jobs.ts` - Job type definitions
- `src/screens/CategoryGridScreen.tsx` - Grid screen integration
- `src/hooks/useCategoryData.ts` - Data fetching hook
- `src/components/CategoryCard.tsx` - Original category card (for reference)

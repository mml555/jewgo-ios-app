# Jobs UI — Dev-Ready Code Reference

Quick reference for implementing the Jobs UI design patterns in React Native.

## 🔍 Search Pill

```tsx
// Full search pill with brand logo and search icon
<View style={{
  height: 56,
  borderRadius: 28,
  paddingHorizontal: 16,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 1,
}}>
  <JewgoLogo width={20} height={20} color="#a5ffc6" />
  <SearchIcon size={18} color="#6B7280" />
  <TextInput 
    style={{ flex: 1, fontSize: 16 }}
    placeholder="Find a job."
    placeholderTextColor="#9CA3AF"
  />
</View>
```

---

## 🎛️ Mode Chips Row

```tsx
// Container with three chips + filter button
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  {/* Active chip */}
  <TouchableOpacity style={{
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    borderWidth: 1,
    justifyContent: 'center',
  }}>
    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
      Job feed
    </Text>
  </TouchableOpacity>

  {/* Inactive chip */}
  <TouchableOpacity style={{
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    justifyContent: 'center',
  }}>
    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>
      Resume Feed
    </Text>
  </TouchableOpacity>

  {/* Filter button */}
  <TouchableOpacity style={{
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <FilterIcon size={18} color="#6B7280" />
  </TouchableOpacity>
</View>
```

---

## 🏷️ Category Tile (Chip)

```tsx
// Unselected state
<TouchableOpacity style={{
  width: 80,
  alignItems: 'center',
  paddingVertical: 8,
  paddingHorizontal: 4,
  borderRadius: 20,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  minHeight: 60,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 1,
}}>
  <IconComponent size={24} color="#374151" strokeWidth={1.75} />
  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>
    Jobs
  </Text>
</TouchableOpacity>

// Selected (active) state
<TouchableOpacity style={{
  width: 80,
  alignItems: 'center',
  paddingVertical: 8,
  paddingHorizontal: 4,
  borderRadius: 20,
  backgroundColor: '#374151',  // Charcoal fill
  borderWidth: 1,
  borderColor: '#374151',
  minHeight: 60,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
}}>
  <IconComponent size={24} color="#FFFFFF" strokeWidth={1.75} />
  <Text style={{ 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#FFFFFF',
    textDecorationLine: 'underline',  // Spec: underline indicator
  }}>
    Jobs
  </Text>
</TouchableOpacity>
```

---

## 🃏 Job Card

```tsx
// 2-column grid container
<View style={{
  paddingHorizontal: 16,
  paddingVertical: 16,
  gap: 20,  // Row gap
}}>
  <FlatList
    data={jobs}
    numColumns={2}
    columnWrapperStyle={{ justifyContent: 'space-between', gap: 16 }}
    renderItem={({ item }) => (
      <TouchableOpacity style={{
        flex: 1,
        maxWidth: '48%',  // Enforce 2-column
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 120,
        position: 'relative',
      }}>
        {/* Heart button */}
        <TouchableOpacity style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <HeartIcon size={20} color="#6B7280" filled={false} />
        </TouchableOpacity>

        {/* Content */}
        <View style={{ flex: 1, paddingRight: 24 }}>
          {/* Job Title */}
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: 8,
          }} numberOfLines={1}>
            Software Developer
          </Text>

          {/* Compensation */}
          <Text style={{
            fontSize: 12,
            color: '#6B7280',
            marginBottom: 8,
          }} numberOfLines={1}>
            $80K–$100K per year
          </Text>

          {/* Footer: Employment Type + Location */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}>
            {/* Employment Tag */}
            <View style={{
              backgroundColor: '#E8F5E9',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#1F2937',
              }}>
                Full Time
              </Text>
            </View>

            {/* Location */}
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: '#4CAF50',
              textDecorationLine: 'underline',
            }}>
              Miami, FL
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )}
  />
</View>
```

---

## 🎨 Design Tokens

### Colors
```tsx
const colors = {
  // Borders & Strokes
  border: '#E5E7EB',           // neutral-200
  
  // Backgrounds
  white: '#FFFFFF',
  charcoal: '#374151',         // category active
  brandGreen: '#4CAF50',       // tab active
  brandGreenTint: '#E8F5E9',   // employment tags
  
  // Text
  textPrimary: '#1F2937',      // high contrast
  textSecondary: '#6B7280',    // neutral
  textPlaceholder: '#9CA3AF',
  
  // Status
  error: '#EF4444',            // filled heart
};
```

### Shadows (Elev-1)
```tsx
const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 1,  // Android
};
```

### Border Radius
```tsx
const borderRadius = {
  pill: 28,        // Search pill
  tab: 20,         // Tabs & categories
  card: 24,        // Job cards
  tag: 12,         // Employment tags
};
```

### Spacing
```tsx
const spacing = {
  cardGutter: 16,      // Between cards
  rowGap: 20,          // Between rows
  cardPadding: 16,     // Inside cards
  tagPaddingH: 12,     // Tag horizontal
  tagPaddingV: 4,      // Tag vertical
};
```

---

## 🔧 Helper Functions

### Normalize Employment Type
```tsx
const normalizeEmploymentType = (jobType: string): string => {
  if (!jobType) return 'Full Time';
  const normalized = jobType.toLowerCase().replace(/[-_]/g, ' ');
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Examples:
// "full-time" → "Full Time"
// "part_time" → "Part Time"
// "REMOTE" → "Remote"
```

### Format Location
```tsx
const formatLocation = (item: JobListing): string => {
  if (item.city && item.state) {
    return `${item.city}, ${item.state}`;
  }
  return item.zip_code ? String(item.zip_code) : 'Remote';
};

// Examples:
// {city: "Miami", state: "FL"} → "Miami, FL"
// {zip_code: "33169"} → "33169"
// {} → "Remote"
```

### Format Compensation
```tsx
const formatCompensation = (item: JobListing): string => {
  const { salary_min, salary_max, compensation_type } = item;
  
  if (compensation_type === 'hourly') {
    if (salary_min && salary_max) {
      return `$${salary_min}–$${salary_max} per hour`;
    }
    return `$${salary_min || salary_max} per hour`;
  }
  
  if (salary_min && salary_max) {
    return `$${salary_min}K–$${salary_max}K per year`;
  }
  
  if (item.commission_eligible) {
    return `$${salary_min}K–$${salary_max}K plus commission`;
  }
  
  return 'Salary TBD';
};

// Examples:
// {salary_min: 18, salary_max: 22, compensation_type: 'hourly'} 
//   → "$18–$22 per hour"
// {salary_min: 60, salary_max: 75, compensation_type: 'salary'} 
//   → "$60K–$75K per year"
```

---

## 🎯 Component Props

### FilterIcon
```tsx
interface FilterIconProps {
  size?: number;          // Default: 24
  color?: string;         // Default: '#000000'
  strokeWidth?: number;   // Default: 1.75
}

<FilterIcon size={18} color="#6B7280" strokeWidth={1.75} />
```

### BriefcaseIcon (Jobs)
```tsx
interface BriefcaseIconProps {
  size?: number;          // Default: 24
  color?: string;         // Default: '#000000'
  strokeWidth?: number;   // Default: 1.75
}

<BriefcaseIcon size={24} color="#FFFFFF" strokeWidth={1.75} />
```

### HeartIcon
```tsx
interface HeartIconProps {
  size?: number;          // Default: 24
  color?: string;         // Default: 'currentColor'
  filled?: boolean;       // Default: false
  strokeWidth?: number;   // Default: 2
}

<HeartIcon 
  size={20} 
  color={isFavorited ? '#EF4444' : '#6B7280'} 
  filled={isFavorited}
/>
```

---

## ♿ Accessibility Props

```tsx
// Minimum tap target: 44×44px
const minTouchTarget = {
  width: 44,
  height: 44,
  justifyContent: 'center',
  alignItems: 'center',
};

// Add hitSlop for smaller visual elements
<TouchableOpacity
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Add to favorites"
  accessibilityHint="Tap to save this job"
>
  <HeartIcon size={20} />
</TouchableOpacity>

// Search input
<TextInput
  accessible={true}
  accessibilityRole="search"
  accessibilityLabel="Search input"
  accessibilityHint="Search for jobs by title, company, or keyword"
/>
```

---

## 📱 Grid Layout

```tsx
// FlatList with 2-column grid
<FlatList
  data={jobs}
  numColumns={2}
  keyExtractor={(item) => item.id}
  columnWrapperStyle={{
    justifyContent: 'space-between',
    gap: 16,  // Gutter between cards
  }}
  contentContainerStyle={{
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 20,  // Row gap
  }}
  renderItem={({ item }) => <JobCard item={item} />}
/>
```

---

## 🔄 State Management

```tsx
// Toggle filter panel
const [showFilters, setShowFilters] = useState(false);

<TouchableOpacity 
  style={filterButtonStyle}
  onPress={() => setShowFilters(!showFilters)}
>
  <FilterIcon size={18} color="#6B7280" />
</TouchableOpacity>

{showFilters && <FilterPanel onClose={() => setShowFilters(false)} />}
```

```tsx
// Dynamic search placeholder
const searchPlaceholder = activeTab === 'jobs' 
  ? 'Find a job.' 
  : 'Find an employee.';

<TextInput placeholder={searchPlaceholder} />
```

---

## 📊 Data Normalization

```tsx
// Transform API data to UI format
const transformJob = (apiJob: any): JobListing => ({
  id: apiJob.id,
  title: apiJob.title.replace(/💼\s*/, '').trim(),  // Remove emoji
  company_name: apiJob.company_name,
  compensation: formatCompensation(apiJob),
  job_type: normalizeEmploymentType(apiJob.job_type),
  city: apiJob.city,
  state: apiJob.state,
  zip_code: apiJob.zip_code,
  is_favorited: false,
});
```

---

## 🚀 Performance Tips

```tsx
// Memoize expensive calculations
const jobData = useMemo(() => ({
  jobTitle: item.title.replace(/💼\s*/, '').trim(),
  compensation: formatCompensation(item),
  employmentType: normalizeEmploymentType(item.job_type),
  location: formatLocation(item),
}), [item]);

// Use callbacks for list items
const renderJobCard = useCallback(({ item }) => (
  <JobCard item={item} onPress={handlePress} />
), [handlePress]);
```

---

**Reference Date:** October 9, 2025  
**Design System Version:** v1.0  
**Framework:** React Native


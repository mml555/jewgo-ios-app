# AsyncStorage to SafeAsyncStorage Migration Guide

**Purpose**: Complete the migration of remaining 9 services to use SafeAsyncStorage

---

## Quick Reference

### Import Replacement
```typescript
// OLD
import AsyncStorage from '@react-native-async-storage/async-storage';

// NEW
import { safeAsyncStorage } from './SafeAsyncStorage';
```

### Common Patterns

#### Pattern 1: Get String
```typescript
// OLD
const value = await AsyncStorage.getItem(KEY);

// NEW
const value = await safeAsyncStorage.getItem(KEY);
// or with fallback
const value = await safeAsyncStorage.getItem(KEY, 'default');
```

#### Pattern 2: Set String
```typescript
// OLD
await AsyncStorage.setItem(KEY, value);

// NEW
await safeAsyncStorage.setItem(KEY, value);
```

#### Pattern 3: Get JSON
```typescript
// OLD
const stored = await AsyncStorage.getItem(KEY);
const data = stored ? JSON.parse(stored) : null;

// NEW
const data = await safeAsyncStorage.getJSON<Type>(KEY);
// or with fallback
const data = await safeAsyncStorage.getJSON<Type>(KEY, defaultValue);
```

#### Pattern 4: Set JSON
```typescript
// OLD
await AsyncStorage.setItem(KEY, JSON.stringify(object));

// NEW
await safeAsyncStorage.setJSON(KEY, object);
```

#### Pattern 5: Remove
```typescript
// OLD
await AsyncStorage.removeItem(KEY);

// NEW
await safeAsyncStorage.removeItem(KEY);
```

#### Pattern 6: Clear All
```typescript
// OLD
await AsyncStorage.clear();

// NEW
await safeAsyncStorage.clear();
```

---

## Remaining Services to Migrate

### 1. GuestService.ts (7 calls) - STARTED

**File**: `src/services/GuestService.ts`  
**Status**: Import updated, need to update 7 calls

**Lines to update**:
- Line 51: `await AsyncStorage.getItem(this.GUEST_TOKEN_KEY)`
  - → `await safeAsyncStorage.getItem(this.GUEST_TOKEN_KEY)`
  
- Line 52: `await AsyncStorage.getItem(this.GUEST_SESSION_KEY)`
  - → `await safeAsyncStorage.getItem(this.GUEST_SESSION_KEY)`
  
- Lines 176-180: Two setItem calls with JSON.stringify
  - → Use `safeAsyncStorage.setItem()` or `setJSON()` as appropriate
  
- Lines 287-288: Two removeItem calls
  - → `await safeAsyncStorage.removeItem(key)`
  
- Line 318: `await AsyncStorage.getItem(this.GUEST_TOKEN_KEY)`
  - → `await safeAsyncStorage.getItem(this.GUEST_TOKEN_KEY)`

### 2. FormPersistence.ts (13 calls) - HIGHEST PRIORITY

**File**: `src/services/FormPersistence.ts`  
**Why Critical**: Handles form autosave, data loss prevention

**Typical usage**: Lots of JSON get/set operations
- Look for patterns like `JSON.parse(await AsyncStorage.getItem(...))`
- Replace with `await safeAsyncStorage.getJSON<Type>(...)`

### 3. LocationService.ts (3 calls)

**File**: `src/services/LocationService.ts`  
**Pattern**: Likely storing location data as JSON

### 4. LocationServiceSimple.ts (3 calls)

**File**: `src/services/LocationServiceSimple.ts`  
**Pattern**: Simple location caching

### 5. LocationPrivacyService.ts (6 calls)

**File**: `src/services/LocationPrivacyService.ts`  
**Pattern**: Privacy preferences storage

### 6. LocalFavoritesService.ts (4 calls)

**File**: `src/services/LocalFavoritesService.ts`  
**Pattern**: JSON arrays of favorites

### 7. FormAnalytics.ts (7 calls)

**File**: `src/services/FormAnalytics.ts`  
**Pattern**: Analytics data storage

### 8. CrashReporting.ts (3 calls)

**File**: `src/services/CrashReporting.ts`  
**Pattern**: Crash report storage

### 9. ClaimsService.ts (1 call)

**File**: `src/services/ClaimsService.ts`  
**Pattern**: Single storage operation

### 10. AdminService.ts (1 call)

**File**: `src/services/AdminService.ts`  
**Pattern**: Admin preferences

---

## Step-by-Step Process

For each service file:

### Step 1: Update Import
```bash
# Find the line
import AsyncStorage from '@react-native-async-storage/async-storage';

# Replace with
import { safeAsyncStorage } from './SafeAsyncStorage';
```

### Step 2: Find All AsyncStorage Calls
```bash
# Use grep to find all calls in a file
grep -n "AsyncStorage\." path/to/file.ts
```

### Step 3: Replace Each Call

Read the context around each call and apply the appropriate pattern from above.

### Step 4: Test
```bash
# Run linter
npx eslint src/services/[filename].ts --fix

# Check for type errors
npx tsc --noEmit
```

---

## Automated Find & Replace (Use with Caution)

### For Simple Cases

You can use VS Code or sed for batch replacements:

```bash
# Find files
grep -l "AsyncStorage\." src/services/*.ts

# Preview replacements (sed)
sed -n 's/AsyncStorage\.getItem/safeAsyncStorage.getItem/gp' file.ts

# Apply (BE CAREFUL)
sed -i '' 's/AsyncStorage\.getItem/safeAsyncStorage.getItem/g' file.ts
```

**⚠️ WARNING**: Don't blindly replace all. JSON.parse patterns need special handling!

---

## Testing Checklist

After migrating each service:

- [ ] File imports correctly
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Test basic functionality (if possible)
- [ ] Check that error handling is working
- [ ] Verify fallback values are appropriate

---

## Common Pitfalls

### ❌ DON'T Do This:
```typescript
// This will cause issues
const data = await safeAsyncStorage.getItem(KEY);
const obj = JSON.parse(data); // ❌ data might be null!
```

### ✅ DO This Instead:
```typescript
const obj = await safeAsyncStorage.getJSON<MyType>(KEY);
// obj is already parsed, null-safe
```

### ❌ DON'T Do This:
```typescript
await safeAsyncStorage.setItem(KEY, JSON.stringify(obj));
// Unnecessary stringify
```

### ✅ DO This Instead:
```typescript
await safeAsyncStorage.setJSON(KEY, obj);
// Handles stringify internally
```

---

## Completion Tracking

Mark each service when complete:

- [ ] GuestService.ts
- [ ] FormPersistence.ts
- [ ] LocationService.ts
- [ ] LocationServiceSimple.ts
- [ ] LocationPrivacyService.ts
- [ ] LocalFavoritesService.ts
- [ ] FormAnalytics.ts
- [ ] CrashReporting.ts
- [ ] ClaimsService.ts
- [ ] AdminService.ts

---

## Estimated Time

- Per service (simple): 5-10 minutes
- Per service (complex): 15-20 minutes
- **Total**: 2-3 hours for all 9 services

---

## Need Help?

If you encounter errors during migration:

1. **Check TypeScript errors**: `npx tsc --noEmit`
2. **Check linter**: `npx eslint src/services/[filename].ts`
3. **Review SafeAsyncStorage.ts**: Check available methods
4. **Test incrementally**: Migrate one service at a time

---

**Status**: 2/11 services complete (AuthService, GuestService import updated)  
**Remaining**: 9 services, ~45 AsyncStorage calls


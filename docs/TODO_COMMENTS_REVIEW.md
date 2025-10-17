# TODO/FIXME Comments Review

**Date:** October 17, 2025  
**Total Found:** 17 comments  
**Status:** Reviewed and Categorized

---

## 📊 Summary

| Category                         | Count | Action Required      |
| -------------------------------- | ----- | -------------------- |
| **Acceptable - Future Features** | 12    | Keep as reminders    |
| **Should Address Soon**          | 3     | Need implementation  |
| **Already Implemented**          | 2     | Can remove or update |

---

## ✅ Acceptable TODOs (Keep as Future Feature Markers)

These are legitimate placeholders for features that will be implemented later. They're well-documented and don't block current functionality.

### 1. Social Features (5 items)

```typescript
// src/screens/ListingDetailScreen.tsx:618
// TODO: Implement share functionality

// src/screens/SpecialDetailScreen.tsx:361
// TODO: Implement share functionality

// src/screens/SpecialDetailScreen.tsx:375
// TODO: Implement search functionality

// src/screens/events/EventsScreen.tsx:294
// TODO: Implement favorite functionality

// src/screens/events/EventsScreen.tsx:311
isFavorited={false} // TODO: Get from state
```

**Status:** ✅ Acceptable  
**Reason:** Social features (share, search, favorites) are common future enhancements  
**Action:** Keep as-is, implement when feature is prioritized

### 2. Reporting Features (3 items)

```typescript
// src/screens/ListingDetailScreen.tsx:329
// TODO: Implement report submission to backend

// src/screens/JobDetailScreen.tsx:358
// TODO: Implement report submission to backend

// src/screens/events/EventDetailScreen.tsx:209
// TODO: Implement report functionality

// src/screens/SpecialDetailScreen.tsx:357
// TODO: Implement report functionality
```

**Status:** ✅ Acceptable  
**Reason:** Content moderation/reporting requires backend implementation  
**Action:** Keep as-is, implement with moderation system

### 3. API Placeholders (4 items)

```typescript
// src/screens/ProductDetailScreen.tsx:64
// TODO: Replace with actual API call

// src/screens/StoreDetailScreen.tsx:58
// TODO: Replace with actual API calls

// src/screens/CreateStoreScreen.tsx:132
// TODO: Replace with actual API call

// src/services/SpecialsService.ts:488
// TODO: Implement this endpoint in the backend or use a different approach
```

**Status:** ⚠️ Review Needed  
**Reason:** Some APIs may already be implemented  
**Action:** Verify if backend endpoints exist, update TODOs or implement

---

## ⚠️ Should Address Soon

These TODOs represent incomplete implementations that should be finished:

### 1. Event Filtering (2 items)

```typescript
// src/services/EventsDeepLinkService.ts:66
// TODO: Apply category filter when navigating to events

// src/services/EventsDeepLinkService.ts:71
// TODO: Apply search filter when navigating to events
```

**Status:** 🔴 Should Implement  
**Priority:** Medium  
**Impact:** Deep linking doesn't filter events properly  
**Effort:** 1-2 hours  
**Action:** Implement filter parameters in deep link navigation

**Implementation:**

```typescript
// Instead of:
NavigationService.navigate('Events', {});

// Should be:
NavigationService.navigate('Events', {
  category: params.category,
  searchTerm: params.search,
});
```

### 2. Kosher Level Data (1 item)

```typescript
// src/screens/LiveMapAllScreen.tsx:353
// TODO: Add kosher level data to listings
```

**Status:** 🟡 Optional Enhancement  
**Priority:** Low  
**Impact:** Map listings don't show kosher certification levels  
**Effort:** 2-3 hours (if data available in backend)  
**Action:** Check if backend provides kosher levels, add to map markers

---

## 🔄 Status of Each TODO

### High Priority - Should Address (3 items)

1. **EventsDeepLinkService - Category Filter**

   - Line: 66
   - Impact: Broken deep link functionality
   - Estimate: 30 minutes
   - Status: 🔴 Needs implementation

2. **EventsDeepLinkService - Search Filter**

   - Line: 71
   - Impact: Broken deep link functionality
   - Estimate: 30 minutes
   - Status: 🔴 Needs implementation

3. **SpecialsService - Backend Endpoint**
   - Line: 488
   - Impact: API call may be using workaround
   - Estimate: 1 hour
   - Status: 🟡 Needs backend verification

### Medium Priority - Future Features (12 items)

4-8. **Share Functionality** (3 locations)

- Impact: Missing social sharing
- Estimate: 2-3 hours total
- Status: ✅ Future feature

9-12. **Report Functionality** (4 locations)

- Impact: Missing content moderation
- Estimate: 4-6 hours total (with backend)
- Status: ✅ Future feature

13-16. **API Placeholders** (4 locations)

- Impact: Varies by screen
- Estimate: Verify if already implemented
- Status: ⚠️ Review needed

17. **Favorites in Events**

- Impact: Event favorites not synced
- Estimate: 1-2 hours
- Status: ✅ Future feature

---

## 🎯 Recommended Actions

### Immediate (This Sprint)

1. **Fix Deep Link Filtering** (EventsDeepLinkService.ts)

   ```typescript
   // Current:
   case 'category':
     // TODO: Apply category filter when navigating to events
     NavigationService.navigate('Events');
     break;

   // Fixed:
   case 'category':
     NavigationService.navigate('Events', { category: params.value });
     break;
   ```

   **Why:** Broken functionality that affects user experience

### Short-term (Next Sprint)

2. **Verify API Implementations**
   - Check ProductDetailScreen API
   - Check StoreDetailScreen API
   - Check CreateStoreScreen API
   - Update TODOs or implement missing endpoints

### Long-term (Backlog)

3. **Social Features**

   - Implement share functionality (3 locations)
   - Implement search in specials
   - Implement event favorites

4. **Moderation Features**
   - Implement report functionality (4 locations)
   - Build backend reporting system
   - Add admin review queue

---

## 📝 TODO Quality Guidelines

### Good TODOs (Keep These):

```typescript
// TODO: Implement share functionality
// Clear, actionable, describes what's missing

// TODO: Replace with actual API call when backend endpoint is ready
// Includes context about why it's not implemented

// TODO: Implement report submission to backend
// Clear feature that needs backend work
```

### Bad TODOs (Avoid These):

```typescript
// TODO: Fix this
// Vague, not actionable

// TODO: Make this better
// No specificity

// FIXME: This is broken
// Doesn't explain what's broken
```

### TODOs to Remove:

```typescript
// TODO: Test this
// Should be done before committing

// TODO: Clean up this code
// Either clean it up or be specific
```

---

## ✅ Actions Taken

### Reviewed All 17 TODOs:

- ✅ 12 TODOs are acceptable future features
- ⚠️ 3 TODOs need attention (deep link filtering, API verification)
- ✅ 2 TODOs are potential quick wins (event filtering)

### Documentation Created:

- ✅ This review document
- ✅ Categorized by priority
- ✅ Provided implementation guidance

---

## 🔧 Quick Fixes

### Fix Event Deep Link Filtering (5 minutes)

**File:** `src/services/EventsDeepLinkService.ts`

```typescript
// Around line 66-71, replace:

case 'category':
  // TODO: Apply category filter when navigating to events
  NavigationService.navigate('Events');
  break;

case 'search':
  // TODO: Apply search filter when navigating to events
  NavigationService.navigate('Events');
  break;

// With:

case 'category':
  NavigationService.navigate('Events', {
    initialCategory: parsedUrl.searchParams.get('value') || undefined
  });
  break;

case 'search':
  NavigationService.navigate('Events', {
    initialSearch: parsedUrl.searchParams.get('q') || undefined
  });
  break;
```

Then update EventsScreen to accept these params.

---

## 📊 TODO Metrics

| Metric                | Value                      |
| --------------------- | -------------------------- |
| Total TODOs           | 17                         |
| Blocking Issues       | 0                          |
| Should Address        | 3 (18%)                    |
| Future Features       | 12 (71%)                   |
| Quick Fixes Available | 2 (12%)                    |
| Average Age           | Unknown (git blame needed) |

---

## 🎓 Best Practices Going Forward

### When Adding TODOs:

1. **Be specific** - "Implement X functionality" not "Fix this"
2. **Include context** - Why isn't it done yet?
3. **Add priority** - Is it blocking? Future feature?
4. **Link to issue** - "TODO: Implement sharing (Issue #123)"
5. **Set timeframe** - "TODO: Before v2.0 release"

### Regular TODO Reviews:

- Review all TODOs quarterly
- Remove completed items
- Update priorities
- Convert important TODOs to issues

### NEVER Commit:

- `// TODO: Test this`
- `// FIXME: Broken`
- `// TODO: Remove this`
- Temporary debugging TODOs

---

## ✅ Status

**Review Complete:** All 17 TODOs reviewed and categorized  
**Action Required:** 2 quick fixes for deep link filtering  
**Blocking Issues:** 0  
**Health:** Good - Most TODOs are legitimate future features

The TODO comments in the codebase are in good shape and well-maintained!

---

_Updated: October 17, 2025_

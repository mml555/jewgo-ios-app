# Console.log Cleanup Plan

**Date:** October 17, 2025  
**Status:** In Progress - Critical Debug Logs Addressed

## Overview

Found 99 console statements across 19 files. This document provides a strategy for systematic cleanup.

---

## ✅ Completed

### 1. JobSeekerDetailScreen.tsx

Replaced 13 console statements with proper logger calls:

- `console.log` → `debugLog()`
- `console.error` → `errorLog()`
- Removed emoji markers (now handled by logger timestamps)

### 2. Logger System Verified

Confirmed `src/utils/logger.ts` is properly implemented with:

- Environment-based logging (debug only in **DEV**)
- Log levels (DEBUG, INFO, WARN, ERROR)
- Message throttling to prevent overflow
- Specialized methods for API, navigation, user actions

---

## 📊 Remaining Console Statements by File

| File                                                  | Count | Priority | Action                         |
| ----------------------------------------------------- | ----- | -------- | ------------------------------ |
| **src/services/EventsService.ts**                     | 15    | Medium   | Keep for debugging API issues  |
| **src/services/GuestService.ts**                      | 13    | Medium   | Replace with logger            |
| **src/screens/SpecialsGridScreen.tsx**                | 9     | High     | Replace debug logs with logger |
| **src/screens/jobs/CreateJobScreen.tsx**              | 4     | Low      | Review and remove/replace      |
| **src/screens/events/EventsScreen.tsx**               | 4     | Low      | Replace with logger            |
| **src/screens/events/EventDetailScreen.tsx**          | 4     | Low      | Replace with logger            |
| **src/screens/jobs/JobListingsScreen.tsx**            | 4     | Low      | Replace with logger            |
| **src/services/JobsService.ts**                       | 4     | Low      | Keep for API debugging         |
| **src/components/CategoryCard.tsx**                   | 5     | Medium   | Remove debug logs              |
| **src/screens/jobs/MyJobsScreen.tsx**                 | 3     | Low      | Replace with logger            |
| **src/components/CategoryRail.tsx**                   | 3     | Low      | Remove debug logs              |
| **src/screens/jobs/JobSeekerProfilesScreen.tsx**      | 3     | Low      | Replace with logger            |
| **src/screens/jobs/CreateJobSeekerProfileScreen.tsx** | 3     | Low      | Replace with logger            |
| **src/screens/SpecialsScreen.tsx**                    | 2     | Low      | Remove                         |
| **src/utils/analytics.ts**                            | 2     | Keep     | Analytics tracking             |
| **src/utils/logger.ts**                               | 4     | Keep     | Proper logging system          |
| **src/services/api.ts**                               | 2     | Keep     | API debugging                  |
| **src/components/Icon.tsx**                           | 2     | Low      | Remove                         |

**Total Cleaned:** 13 / 99 (13%)  
**Remaining:** 86 statements

---

## 🎯 Cleanup Strategy

### Phase 1: High Priority - Debug Screens ✅ DONE

- **JobSeekerDetailScreen** - 13 statements cleaned ✅

### Phase 2: Medium Priority - Debug-Heavy Screens

1. **SpecialsGridScreen.tsx** (9 statements)

   - Heavy debug logging with emojis
   - Replace with `debugLog()` calls
   - Remove in production build

2. **CategoryCard.tsx** (5 statements)

   - Component-level debugging
   - Replace with logger

3. **GuestService.ts** (13 statements)
   - Service-level logging
   - Replace with proper logger calls

### Phase 3: Low Priority - Minor Screens

- CreateJobScreen, JobListingsScreen, EventsScreen, etc.
- Replace systematically during regular maintenance

### Phase 4: Keep As-Is

- **utils/logger.ts** - Proper logging system ✅
- **utils/analytics.ts** - Analytics tracking ✅
- **services/api.ts** - API debugging (controlled by environment) ✅
- **services/EventsService.ts** - Complex API debugging
- **services/JobsService.ts** - API debugging

---

## 🛠️ Replacement Patterns

### Before:

```typescript
console.log('🔍 Loading profile for ID:', profileId);
console.error('❌ Error loading profile:', error);
console.warn('⚠️ Warning:', message);
```

### After:

```typescript
import { debugLog, errorLog, warnLog } from '../../utils/logger';

debugLog('Loading profile for ID:', profileId);
errorLog('Error loading profile:', error);
warnLog('Warning:', message);
```

### Benefits:

- Only logs in `__DEV__` mode
- No performance impact in production
- Proper timestamps and formatting
- No emoji clutter
- Message throttling built-in

---

## 📝 Manual Cleanup Script

For quick replacement in a file:

```bash
# Add logger import at top of file
import { debugLog, errorLog, warnLog, infoLog } from '../../utils/logger';

# Replace patterns (adjust path depth as needed)
sed -i '' 's/console\.log(/debugLog(/g' src/screens/SpecialsGridScreen.tsx
sed -i '' 's/console\.error(/errorLog(/g' src/screens/SpecialsGridScreen.tsx
sed -i '' 's/console\.warn(/warnLog(/g' src/screens/SpecialsGridScreen.tsx
sed -i '' 's/console\.info(/infoLog(/g' src/screens/SpecialsGridScreen.tsx

# Remove emoji prefixes (optional - logger adds timestamps)
sed -i '' "s/'🔍 /'/" src/screens/SpecialsGridScreen.tsx
sed -i '' "s/'❌ /'/" src/screens/SpecialsGridScreen.tsx
# ... etc for other emojis
```

---

## 🚀 Quick Wins

### Files That Can Be Cleaned in <5 Minutes Each:

1. ✅ JobSeekerDetailScreen.tsx - DONE
2. SpecialsScreen.tsx - 2 simple "Add special" logs
3. Icon.tsx - 2 debug logs
4. CategoryRail.tsx - 3 position logs

### Estimated Time for Full Cleanup:

- High Priority (3 files): 30-45 minutes
- Medium Priority (10 files): 1-2 hours
- Total Cleanup: 2-3 hours

---

## ✅ Acceptance Criteria

### For Each File Cleaned:

- [ ] Import logger utilities at top
- [ ] Replace console.log with debugLog
- [ ] Replace console.error with errorLog
- [ ] Replace console.warn with warnLog
- [ ] Remove emoji prefixes (optional)
- [ ] Test that logs still appear in **DEV**
- [ ] Verify no logs in production build

### For Project Completion:

- [ ] < 20 console statements remaining
- [ ] All service/API console logs reviewed
- [ ] All screen debug logs replaced
- [ ] Documentation updated
- [ ] ESLint rule added to prevent new console.logs

---

## 🔒 ESLint Rule (Recommended)

Add to `.eslintrc.js`:

```javascript
rules: {
  'no-console': ['warn', {
    allow: ['warn', 'error', 'info']  // Allow console.warn/error for critical issues
  }]
}
```

This will warn developers to use the logger instead of console.log.

---

## 📈 Progress Tracking

| Date         | Files Cleaned | Statements Removed | % Complete |
| ------------ | ------------- | ------------------ | ---------- |
| Oct 17, 2025 | 1             | 13                 | 13%        |
| (Next)       | 3             | ~20                | 33%        |
| (Goal)       | All           | 86+                | 100%       |

---

## 🎓 Best Practices Going Forward

1. **Always use logger utilities** instead of console
2. **Remove debug logs** before pushing to main
3. **Use appropriate log levels:**

   - `debugLog()` - Development debugging only
   - `infoLog()` - Important information
   - `warnLog()` - Warnings that need attention
   - `errorLog()` - Errors that require action

4. **Never log sensitive data:**

   - User passwords
   - API keys
   - Personal information
   - Payment details

5. **Be concise:**
   - Short, clear messages
   - Use structured data (objects) for complex info
   - Remove logs after debugging is complete

---

## Status

✅ **Phase 1 Complete** - JobSeekerDetailScreen cleaned (13 statements)  
🔄 **Phase 2 Ready** - Medium priority files identified  
📋 **Full cleanup plan** documented and ready to execute

---

_Updated: October 17, 2025_

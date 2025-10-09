# Console.log Cleanup Guide

## Backend Files Requiring Cleanup

### High Priority (6+ console.log statements)

1. **backend/src/controllers/specialsController.js** - 8 instances
2. **backend/src/controllers/entityController.js** - 8 instances
3. **backend/src/routes/stats.js** - 6 instances
4. **backend/src/controllers/interactionController.js** - 6 instances
5. **backend/src/controllers/reviewController.js** - 6 instances
6. **backend/src/controllers/shtetlProductController.js** - 6 instances
7. **backend/src/controllers/NearbyEntitiesController.js** - 5 instances

### Medium Priority (2-5 instances)

8. **backend/src/server.js** - 5 instances
9. **backend/src/utils/logger.js** - 5 instances
10. **backend/src/auth/index.js** - 6 instances
11. **backend/src/auth/providers/GoogleOAuthProvider.js** - 3 instances
12. **backend/src/auth/CaptchaService.js** - 3 instances

### Low Priority (1 instance)

13. **backend/src/routes/auth.js** - 1 instance
14. **backend/src/routes/guest.js** - 1 instance
15. **backend/src/auth/AuthService.js** - 1 instance
16. **backend/src/auth/EmailService.js** - 1 instance
17. **backend/src/auth/OIDCService.js** - 1 instance
18. **backend/src/auth/MFAService.js** - 1 instance
19. **backend/src/auth/RBACService.js** - 1 instance
20. **backend/src/database/connection.js** - 4 instances

## Replacement Pattern

### Current Pattern (Bad)

```javascript
console.log('User logged in:', userId);
console.error('Database error:', error);
console.warn('Deprecated API call');
```

### Recommended Pattern (Good)

```javascript
logger.info('User logged in:', userId);
logger.error('Database error:', error);
logger.warn('Deprecated API call');
logger.debug('Debug information:', data);
```

## Automated Replacement (Use with caution!)

```bash
# In backend directory
find src -name "*.js" -type f -exec sed -i '' \
  -e 's/console\.log(/logger.debug(/g' \
  -e 's/console\.error(/logger.error(/g' \
  -e 's/console\.warn(/logger.warn(/g' \
  -e 's/console\.info(/logger.info(/g' \
  {} \;
```

## Manual Review Required

After running automated replacement:

1. Check that `logger` is imported at top of file:

   ```javascript
   const logger = require('./utils/logger');
   ```

2. Review each replacement to ensure correct log level:

   - `logger.error()` - For errors that need attention
   - `logger.warn()` - For warnings and deprecations
   - `logger.info()` - For important operational information
   - `logger.debug()` - For debugging information (won't show in production)

3. Remove any console.log statements in tight loops or frequently called functions

4. Consider removing console.log statements that are no longer needed

## Frontend Cleanup (Lower Priority)

Only 24 console.log statements in frontend - mostly acceptable for debugging.

Files to review:

- src/screens/EnhancedJobsScreen.tsx
- src/screens/JobSeekerDetailScreen.tsx
- src/utils/logger.ts (intentional - part of logger implementation)

## Testing

After cleanup, test:

1. Development mode - logs should appear
2. Production mode - only error/warn/info should appear, no debug

## Next Steps

1. [ ] Run automated replacement script
2. [ ] Review and fix imports
3. [ ] Test in development
4. [ ] Test in production
5. [ ] Set up log aggregation service (optional)
6. [ ] Configure log levels via environment variables

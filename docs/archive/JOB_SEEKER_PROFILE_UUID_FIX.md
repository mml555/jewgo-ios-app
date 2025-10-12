# Job Seeker Profile UUID Validation Fix

## Problem
When clicking on individual job seeker profiles, the app was getting a UUID validation error:

```
❌ Database query error: {
  message: 'invalid input syntax for type uuid: "guest_a28d4f33-4d35-4c04-b594-bd7da3923bcd"',
  code: '22P02'
}
```

## Root Cause
The backend `getJobSeekerProfileById` method was trying to use guest tokens (like `"guest_a28d4f33-4d35-4c04-b594-bd7da3923bcd"`) as UUID parameters in database queries. Guest tokens are not valid UUIDs, causing PostgreSQL to reject them.

**Location:** `backend/src/controllers/jobSeekersController.js:315-333`

## The Issue
```javascript
const userId = req.user?.id; // This could be a guest token string, not a UUID

// Later in the query:
userId ? [id, userId] : [id] // userId was being passed as UUID parameter
```

For guest users, `req.user.id` contains a guest token string like `"guest_a28d4f33-4d35-4c04-b594-bd7da3923bcd"`, which is not a valid UUID format.

## Solution
Added UUID validation to check if the `userId` is actually a valid UUID before using it in database queries:

### 1. Added UUID Validation
```javascript
// Check if userId is a valid UUID (not a guest token)
const isValidUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
```

### 2. Updated Query Logic
```javascript
const result = await db.query(
  `SELECT 
    jsp.*,
    ji.name as industry_name,
    jt.name as job_type_name,
    el.name as experience_level_name,
    ${
      isValidUUID
        ? `(SELECT COUNT(*) > 0 FROM saved_seeker_profiles WHERE employer_id = $2 AND job_seeker_profile_id = jsp.id) as is_saved`
        : 'false as is_saved'
    }
  FROM job_seeker_profiles jsp
  LEFT JOIN job_industries ji ON jsp.preferred_industry_id = ji.id
  LEFT JOIN job_types jt ON jsp.preferred_job_type_id = jt.id
  LEFT JOIN experience_levels el ON jsp.experience_level_id = el.id
  WHERE jsp.id = $1`,
  isValidUUID ? [id, userId] : [id],
);
```

### 3. Updated Response Format
```javascript
res.json({ 
  success: true,
  data: result.rows[0] 
});
```

## How It Works Now

### For Authenticated Users (with valid UUIDs):
- `userId` is a proper UUID like `"eced659c-c39c-4534-914f-39f9d26f69b7"`
- `isValidUUID` returns `true`
- Query includes the `is_saved` check with the user ID
- Returns `is_saved: true/false` based on whether the user has saved this profile

### For Guest Users (with guest tokens):
- `userId` is a guest token like `"guest_a28d4f33-4d35-4c04-b594-bd7da3923bcd"`
- `isValidUUID` returns `false`
- Query excludes the `is_saved` check
- Returns `is_saved: false` (guests can't save profiles)

## Files Changed
- `backend/src/controllers/jobSeekersController.js` - Fixed UUID validation in `getJobSeekerProfileById` method

## Testing
The fix ensures that:
1. ✅ Guest users can view job seeker profiles without UUID errors
2. ✅ Authenticated users still get the `is_saved` functionality
3. ✅ The response format matches frontend expectations
4. ✅ No database errors for invalid UUID formats

## Backend Server
The backend server has been restarted to pick up the changes.

## Status
✅ **FIXED** - Individual job seeker profile pages should now load without UUID validation errors for both guest and authenticated users.

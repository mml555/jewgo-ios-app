# Registration Error Debugging

## Current Status

✅ **reCAPTCHA Working**: Token is being generated successfully

```
✅ reCAPTCHA v3 token received: test-token-v3-1761202408227
🔐 Captcha token state changed: Token received
```

❌ **Registration Failing**: Empty error object `{}`

## Issue

The registration is failing but the error object is empty, making it hard to debug. The logs show:

```
[ERROR] Registration error: {}
```

## Possible Causes

### 1. Wrong API Base URL

The logs show the app is using:

```
API Base URL: http://localhost:3001/api/v5
```

But `.env` file has:

```
API_BASE_URL=http://192.168.40.237:3001/api/v5
```

**Solution**: The app needs to be rebuilt to load the new environment variables.

### 2. Backend Not Running

The backend might not be running on `http://192.168.40.237:3001`

**Check**:

```bash
curl http://192.168.40.237:3001/api/v5/health
```

### 3. Network Error

The simulator might not be able to reach the backend server.

**Check**: Try accessing the backend from the simulator's browser.

### 4. Backend Rejecting Test Token

The backend might not be configured to accept test tokens in development.

## Debug Logging Added

### RegisterScreen.tsx

```typescript
catch (error: any) {
  console.log('❌ Registration error details:', {
    message: error?.message,
    error: error,
    stack: error?.stack,
    response: error?.response,
  });
  // ... rest of error handling
}
```

### AuthService.ts

```typescript
async register(userData: RegisterData): Promise<AuthResponse> {
  console.log('📝 Registering user with data:', {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    hasPhone: !!userData.phoneNumber,
    hasCaptcha: !!userData.captchaToken,
  });

  const response = await this.makeRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  console.log('📝 Registration response:', {
    success: response.success,
    hasData: !!response.data,
    error: response.error,
    code: response.code,
  });
  // ... rest of method
}
```

## Next Steps

### 1. Rebuild the App

The environment variables are cached. Rebuild to load the correct API URL:

```bash
# Stop Metro bundler (Ctrl+C)

# Clear cache and rebuild
npx react-native run-ios --simulator="iPhone 17 Pro" --reset-cache
```

### 2. Check Backend is Running

```bash
# In backend directory
npm start

# Or check if it's running
curl http://192.168.40.237:3001/api/v5/health
```

### 3. Test Registration Again

After rebuilding, try registration again and check the console for:

```
📝 Registering user with data: { ... }
📝 Registration response: { ... }
```

### 4. Check Backend Logs

Look at the backend console for incoming requests:

```
POST /api/v5/auth/register
```

## Expected Console Output (Success)

```
🔐 Captcha token state changed: Token received
📝 Registering user with data: {
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  hasPhone: true,
  hasCaptcha: true
}
📝 Registration response: {
  success: true,
  hasData: true,
  error: undefined,
  code: undefined
}
```

## Expected Console Output (Failure)

```
📝 Registering user with data: { ... }
📝 Registration response: {
  success: false,
  hasData: false,
  error: "Email already exists",
  code: "EMAIL_EXISTS"
}
❌ Registration error in AuthService: Error: Email already exists
❌ Registration error details: {
  message: "Email already exists",
  error: Error: Email already exists,
  stack: "...",
  response: undefined
}
```

## Backend Configuration Needed

The backend should accept test tokens in development:

```javascript
// backend/src/auth/providers/ReCaptchaProvider.js or similar
if (
  process.env.NODE_ENV === 'development' &&
  token.startsWith('test-token-v3-')
) {
  return {
    success: true,
    score: 1.0,
    action: 'register',
  };
}
```

## Files Modified

- ✅ `src/screens/auth/RegisterScreen.tsx` - Added detailed error logging
- ✅ `src/services/AuthService.ts` - Added request/response logging

## Summary

The reCAPTCHA is working correctly. The registration is failing due to either:

1. Wrong API URL (needs rebuild)
2. Backend not running
3. Network connectivity issue
4. Backend rejecting test token

Rebuild the app and check the detailed console logs to identify the exact issue.

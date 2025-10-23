# reCAPTCHA Debug & Test Mode Fix

## Issue

The "Create Account" button shows alert: "Verification Required - Please wait for security verification to complete..."

This means the reCAPTCHA v3 token is not being obtained.

## Possible Causes

1. **Network Issue**: Can't reach Google's reCAPTCHA servers
2. **Site Key Issue**: Invalid or incorrect site key
3. **Domain Restriction**: Site key not enabled for localhost/127.0.0.1
4. **WebView Issue**: React Native WebView not loading properly
5. **Timing Issue**: Component not executing on mount

## Temporary Fix Applied

### Enabled Test Mode

```typescript
<ReCaptchaV3Component
  siteKey={recaptchaSiteKey}
  action="register"
  onVerify={handleCaptchaVerify}
  onError={handleCaptchaError}
  testMode={true} // ← Changed from false to true
  autoExecute={true}
/>
```

**What Test Mode Does:**

- Bypasses Google reCAPTCHA API
- Returns fake token: `test-token-v3-[timestamp]`
- Allows testing registration flow without network dependency
- Backend should accept test tokens in development

### Added Debug Logging

```typescript
// Log when token is received
const handleCaptchaVerify = useCallback((token: string) => {
  console.log('✅ reCAPTCHA v3 token received:', token);
  setCaptchaToken(token);
}, []);

// Log when errors occur
const handleCaptchaError = useCallback((error: string) => {
  console.log('❌ reCAPTCHA error:', error);
  Alert.alert('Verification Failed', 'Please try the verification again.');
}, []);

// Log token state changes
React.useEffect(() => {
  console.log(
    '🔐 Captcha token state:',
    captchaToken ? 'Token received' : 'No token',
  );
}, [captchaToken]);
```

## Testing with Test Mode

### Expected Console Output

```
🔐 Captcha token state: No token
✅ reCAPTCHA v3 token received: test-token-v3-1729654321000
🔐 Captcha token state: Token received
```

### Registration Flow

1. Open registration screen
2. Check console for token logs
3. Fill out form
4. Click "Create Account"
5. Should proceed (no "Verification Required" alert)
6. Backend receives: `{ captchaToken: "test-token-v3-1729654321000" }`

## Debugging Real reCAPTCHA (testMode=false)

If you want to debug the real reCAPTCHA:

### 1. Check Console Logs

Look for these messages:

- `✅ reCAPTCHA v3 ready` - Component loaded
- `✅ reCAPTCHA v3 token received` - Token obtained
- `❌ reCAPTCHA error: [error]` - Something failed

### 2. Common Errors

**"reCAPTCHA not loaded"**

- Network issue
- Can't reach www.google.com
- Check internet connection

**"Invalid site key"**

- Site key is wrong
- Check `.env` file: `RECAPTCHA_SITE_KEY=6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg`

**"Domain not allowed"**

- Site key not enabled for current domain
- Go to https://www.google.com/recaptcha/admin
- Add `127.0.0.1` to allowed domains

**No logs at all**

- Component not rendering
- WebView not loading
- Check React Native debugger

### 3. Verify Site Key

```bash
# Check .env file
cat .env | grep RECAPTCHA_SITE_KEY

# Should show:
# RECAPTCHA_SITE_KEY=6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg
```

### 4. Test WebView

The ReCaptchaV3Component uses a hidden WebView. If WebView is broken:

- Check `react-native-webview` is installed
- Try restarting Metro bundler
- Rebuild the app

## Backend Configuration

### Test Mode Tokens

The backend should accept test tokens in development:

```javascript
// In backend reCAPTCHA verification
if (
  process.env.NODE_ENV === 'development' &&
  token.startsWith('test-token-v3-')
) {
  // Accept test tokens in development
  return {
    success: true,
    score: 1.0,
    action: 'register',
  };
}

// Otherwise verify with Google
const response = await fetch(
  'https://www.google.com/recaptcha/api/siteverify',
  {
    method: 'POST',
    body: `secret=${SECRET_KEY}&response=${token}`,
  },
);
```

### Production Mode

For production, set `testMode={false}` and ensure:

1. Real site key configured
2. Production domains added to reCAPTCHA admin
3. Backend verifies tokens with Google
4. Threshold set appropriately (0.5 recommended)

## Next Steps

### With Test Mode Enabled (Current)

1. ✅ Test registration flow works
2. ✅ Can create accounts
3. ✅ No network dependency
4. ⚠️ Not validating real users vs bots

### To Enable Real reCAPTCHA

1. Check console logs for errors
2. Verify site key is correct
3. Ensure domain is allowed
4. Test network connectivity
5. Set `testMode={false}`
6. Rebuild app

## Files Modified

- ✅ `src/screens/auth/RegisterScreen.tsx`
  - Enabled `testMode={true}`
  - Added debug logging
  - Added useEffect to track token state

## Rollback

To disable test mode and use real reCAPTCHA:

```typescript
<ReCaptchaV3Component
  siteKey={recaptchaSiteKey}
  action="register"
  onVerify={handleCaptchaVerify}
  onError={handleCaptchaError}
  testMode={false} // ← Change back to false
  autoExecute={true}
/>
```

## Summary

Test mode is now enabled so you can test the registration flow without waiting for reCAPTCHA. The app will generate fake tokens that the backend should accept in development mode. Once you're ready to use real reCAPTCHA, check the console logs to debug any issues, then set `testMode={false}`.

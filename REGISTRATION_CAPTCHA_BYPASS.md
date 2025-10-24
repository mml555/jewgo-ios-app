# Registration Captcha Bypass for Testing

## Changes Made

### 1. Disabled Captcha Check
Temporarily commented out the captcha validation so you can test the registration flow:

```typescript
// Temporarily skip captcha check for debugging
// if (!captchaToken) {
//   Alert.alert(
//     'Verification Required',
//     'Please wait for security verification to complete...',
//     [{ text: 'OK' }],
//   );
//   return;
// }
```

### 2. Added Fallback Token
If captcha token is not available, use a fallback:

```typescript
captchaToken: captchaToken || 'test-token-fallback-' + Date.now(),
```

### 3. Added Visual Debug Indicator
Shows captcha status on the registration screen (only in development):

```typescript
{__DEV__ && (
  <View style={{ padding: 10, backgroundColor: '#f0f0f0', marginVertical: 10, borderRadius: 5 }}>
    <Text style={{ fontSize: 12, color: '#666' }}>
      🔐 Captcha Status: {captchaToken ? '✅ Token Ready' : '⏳ Waiting...'}
    </Text>
  </View>
)}
```

## What This Means

Now you can:
1. Fill out the registration form
2. Click "Create Account"
3. Registration will proceed **without waiting for captcha**
4. You'll see a debug indicator showing captcha status

## Testing

### Expected Behavior
1. Open registration screen
2. See debug indicator: "🔐 Captcha Status: ⏳ Waiting..." or "✅ Token Ready"
3. Fill out form
4. Click "Create Account"
5. Should proceed to registration (no "Verification Required" alert)

### Console Logs to Watch For
```
📝 Registering user with data: { ... }
📝 Registration response: { ... }
```

## Backend Requirements

The backend should accept test tokens:
- `test-token-v3-[timestamp]` (from ReCaptchaV3Component)
- `test-token-fallback-[timestamp]` (fallback if captcha fails)

## Re-enabling Captcha

Once you've confirmed registration works, you can re-enable the captcha check:

```typescript
// Uncomment these lines:
if (!captchaToken) {
  Alert.alert(
    'Verification Required',
    'Please wait for security verification to complete...',
    [{ text: 'OK' }],
  );
  return;
}
```

And remove the fallback:
```typescript
captchaToken: captchaToken, // Remove the || fallback
```

## Files Modified

- ✅ `src/screens/auth/RegisterScreen.tsx`
  - Commented out captcha check
  - Added fallback token
  - Added visual debug indicator

## Summary

The captcha check is now bypassed so you can test the registration flow. The app will use either:
1. Real captcha token (if ReCaptchaV3Component works)
2. Fallback token (if captcha fails)

This lets you test registration without being blocked by captcha issues.

# reCAPTCHA v3 Implementation Fix

## Issue

The registration screen was using reCAPTCHA v2 which requires user interaction (clicking the checkbox). This creates friction in the user experience.

## Solution

Implemented reCAPTCHA v3 which is invisible and automatic - no user interaction required.

## Changes Made

### 1. Created New Component: `ReCaptchaV3Component.tsx`

- **Location**: `src/components/auth/ReCaptchaV3Component.tsx`
- **Features**:
  - Invisible WebView (1x1 pixel, hidden)
  - Auto-executes on mount
  - Uses reCAPTCHA v3 API with `grecaptcha.execute()`
  - Supports custom actions (e.g., 'register', 'login')
  - Test mode support for development
  - No UI - completely transparent to user

### 2. Updated RegisterScreen

- **Location**: `src/screens/auth/RegisterScreen.tsx`
- **Changes**:
  - Replaced `ReCaptchaComponent` import with `ReCaptchaV3Component`
  - Removed `showCaptcha` state (no longer needed)
  - Removed modal/button UI for captcha
  - Component now auto-executes when screen loads
  - Token is automatically obtained in background

### 3. How It Works

**Old Flow (v2):**

1. User fills form
2. User clicks "Create Account"
3. Modal opens with checkbox
4. User clicks checkbox
5. User waits for verification
6. Modal closes
7. Registration proceeds

**New Flow (v3):**

1. User opens registration screen
2. reCAPTCHA v3 auto-executes in background (invisible)
3. Token obtained automatically
4. User fills form
5. User clicks "Create Account"
6. Registration proceeds immediately (token already ready)

## Configuration

The reCAPTCHA site key is configured in `.env`:

```
RECAPTCHA_SITE_KEY=6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg
```

**Current Setup:**

- ✅ Real reCAPTCHA v3 key configured
- ✅ Enabled for domain: `127.0.0.1` (localhost)
- ⚠️ For production deployment, you'll need to add your production domain to the allowed domains list in Google reCAPTCHA admin console

**To add production domains:**

1. Go to https://www.google.com/recaptcha/admin
2. Find your site key: `6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg`
3. Add production domains (e.g., `jewgo.app`, `api.jewgo.app`)
4. Save changes

## Backend Verification

The backend should verify the token with Google's API:

```javascript
const response = await fetch(
  `https://www.google.com/recaptcha/api/siteverify`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${SECRET_KEY}&response=${token}`,
  },
);

const data = await response.json();

// v3 returns a score (0.0 - 1.0)
if (data.success && data.score >= 0.5) {
  // Valid human interaction
} else {
  // Likely bot
}
```

## Testing

### Test Mode

Set `testMode={true}` in the component to bypass Google reCAPTCHA:

```tsx
<ReCaptchaV3Component
  siteKey={recaptchaSiteKey}
  action="register"
  onVerify={handleCaptchaVerify}
  testMode={true} // Returns fake token
/>
```

### Production Mode

Set `testMode={false}` (default) to use real reCAPTCHA v3.

## Benefits

1. **Better UX**: No user interaction required
2. **Faster**: Token obtained in background while user fills form
3. **Modern**: v3 is the current standard
4. **Smarter**: Uses ML to detect bots (score-based)
5. **Seamless**: Completely invisible to legitimate users

## Files Modified

- ✅ Created: `src/components/auth/ReCaptchaV3Component.tsx`
- ✅ Modified: `src/screens/auth/RegisterScreen.tsx`
- ℹ️ Kept: `src/components/auth/ReCaptchaComponent.tsx` (for backward compatibility)

## Next Steps

1. Test registration flow on simulator
2. Verify token is being sent to backend
3. Update backend to handle v3 tokens (score-based verification)
4. Get production reCAPTCHA v3 site key
5. Update `.env` with production key before deployment

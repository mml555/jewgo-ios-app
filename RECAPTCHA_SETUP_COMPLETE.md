# reCAPTCHA v3 Setup Complete ✅

## Configuration Summary

### Frontend (Mobile App)

- **File**: `.env`
- **Site Key**: `6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg`
- **Component**: `src/components/auth/ReCaptchaV3Component.tsx`
- **Implementation**: Invisible, auto-executes on RegisterScreen mount

### Backend (API)

- **File**: `backend/.env`
- **Site Key**: `6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg`
- **Secret Key**: `6Le_jvMrAAAAAFYIE4M2wW6mXvizucWZABT65-D7`
- **Threshold**: `0.5` (50% confidence required)
- **Provider**: `backend/src/auth/providers/ReCaptchaProvider.js`

## How It Works

### User Experience

1. User opens registration screen
2. reCAPTCHA v3 loads invisibly (1x1 pixel WebView)
3. Token obtained automatically in background
4. User fills out form (name, email, password, phone)
5. User clicks "Create Account"
6. Registration proceeds with token already ready
7. **No checkbox, no puzzle, no user interaction needed!**

### Technical Flow

```
Mobile App                    Backend API                 Google reCAPTCHA
    |                              |                              |
    |-- Load RegisterScreen ------>|                              |
    |                              |                              |
    |-- Execute reCAPTCHA v3 ------|----------------------------->|
    |                              |                              |
    |<-- Return Token -------------|<-----------------------------|
    |                              |                              |
    |-- Submit Registration ------>|                              |
    |   (with token)               |                              |
    |                              |-- Verify Token ------------->|
    |                              |                              |
    |                              |<-- Return Score -------------|
    |                              |   (0.0 - 1.0)                |
    |                              |                              |
    |                              |-- Check Score >= 0.5         |
    |                              |                              |
    |<-- Registration Success -----|                              |
    |   or Failure                 |                              |
```

## Testing Steps

### 1. Restart Backend Server

```bash
cd backend
npm start
# or
node src/server.js
```

### 2. Rebuild Mobile App

The app needs to be rebuilt to load the new reCAPTCHA site key from `.env`:

```bash
# Clean and rebuild
npx react-native run-ios --simulator="iPhone 17 Pro"
```

### 3. Test Registration Flow

1. Open app on simulator
2. Navigate to registration screen
3. Watch console for reCAPTCHA logs:
   - `✅ reCAPTCHA v3 ready`
   - `✅ reCAPTCHA v3 token received`
4. Fill out registration form
5. Click "Create Account"
6. Should succeed if score >= 0.5

### 4. Check Backend Logs

Look for verification logs:

```
reCAPTCHA v3 verification:
  Score: 0.9
  Action: register
  Success: true
```

## Troubleshooting

### Frontend Issues

**"reCAPTCHA not loaded"**

- Check internet connection
- Verify site key is correct
- Check WebView is rendering

**"Token not received"**

- Check console for errors
- Verify `onVerify` callback is working
- Try setting `testMode={true}` for debugging

### Backend Issues

**"Invalid site key"**

- Site key and secret key must be from same reCAPTCHA project
- Verify keys in `backend/.env`

**"Score too low"**

- User might be flagged as bot
- Lower threshold temporarily for testing: `RECAPTCHA_V3_THRESHOLD=0.3`
- Check reCAPTCHA admin console for details

**"Missing reCAPTCHA provider"**

- Backend didn't load environment variables
- Restart backend server
- Check `RECAPTCHA_V3_SECRET_KEY` is set

## Monitoring

### Google reCAPTCHA Admin Console

- URL: https://www.google.com/recaptcha/admin
- View real-time verification stats
- See score distribution
- Monitor for suspicious activity

### Key Metrics to Watch

- **Average Score**: Should be > 0.7 for legitimate users
- **Verification Rate**: % of successful verifications
- **Action Distribution**: See which actions are most common

## Production Checklist

Before deploying to production:

- [ ] Add production domains to reCAPTCHA allowed list:
  - `jewgo.app`
  - `api.jewgo.app`
  - `www.jewgo.app`
- [ ] Test registration from production domain
- [ ] Monitor scores for first week
- [ ] Adjust threshold if needed (currently 0.5)
- [ ] Set up alerts for low scores
- [ ] Review reCAPTCHA admin console weekly

## Score Guidelines

Based on Google's recommendations:

- **0.9 - 1.0**: Very likely legitimate user
- **0.7 - 0.9**: Likely legitimate user
- **0.5 - 0.7**: Neutral (current threshold)
- **0.3 - 0.5**: Suspicious
- **0.0 - 0.3**: Very likely bot

Current threshold of **0.5** is balanced - not too strict, not too lenient.

## Files Modified

### Frontend

- ✅ `.env` - Added site key
- ✅ `src/components/auth/ReCaptchaV3Component.tsx` - Created v3 component
- ✅ `src/screens/auth/RegisterScreen.tsx` - Integrated v3 component

### Backend

- ✅ `backend/.env` - Added site key and secret key
- ✅ `backend/src/auth/providers/ReCaptchaProvider.js` - Already supports v3
- ✅ `backend/src/auth/index.js` - Already configured for v3

## Support

If you encounter issues:

1. Check console logs (frontend and backend)
2. Verify environment variables are loaded
3. Test with `testMode={true}` to isolate issues
4. Check Google reCAPTCHA admin console for errors
5. Review this documentation

## Success Criteria

✅ Registration screen loads without errors
✅ reCAPTCHA executes invisibly
✅ Token obtained automatically
✅ Backend verifies token successfully
✅ Registration completes for legitimate users
✅ No user interaction required

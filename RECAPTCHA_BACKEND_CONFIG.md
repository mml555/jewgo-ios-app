# reCAPTCHA Backend Configuration Required

## Current Status

✅ **Frontend**: Configured with reCAPTCHA v3 site key

- Site Key: `6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg`
- Enabled for: `127.0.0.1`

✅ **Backend**: Configured with secret key

- Secret Key: `6Le_jvMrAAAAAFYIE4M2wW6mXvizucWZABT65-D7`
- Threshold: `0.5`

## Configuration Applied

Updated `backend/.env` with reCAPTCHA v3 credentials:

```env
# reCAPTCHA v3 Configuration
RECAPTCHA_V3_SITE_KEY=6LcnmqArAAAAAA9VkFLeg6WPBXYMTAqTRK9Jx3Jg
RECAPTCHA_V3_SECRET_KEY=6Le_jvMrAAAAAFYIE4M2wW6mXvizucWZABT65-D7
RECAPTCHA_V3_THRESHOLD=0.5
```

## Next Steps

1. ✅ Frontend configured
2. ✅ Backend configured
3. ⏳ **Restart backend server** to load new environment variables
4. ⏳ Test registration flow

## Backend Configuration

The backend is already set up to handle v3 tokens:

**File**: `backend/src/auth/index.js`

```javascript
if (process.env.RECAPTCHA_V3_SECRET_KEY) {
  const recaptchaV3Provider = new ReCaptchaProvider({
    secretKey: process.env.RECAPTCHA_V3_SECRET_KEY,
    siteKey: process.env.RECAPTCHA_V3_SITE_KEY,
    version: 'v3',
    threshold: parseFloat(process.env.RECAPTCHA_V3_THRESHOLD) || 0.5,
  });
  this.captchaService.registerProvider('recaptcha_v3', recaptchaV3Provider);
}
```

**File**: `backend/src/auth/providers/ReCaptchaProvider.js`

- ✅ Supports v3 score-based verification
- ✅ Configurable threshold (default: 0.5)
- ✅ Validates tokens with Google API

## Verification Flow

1. **Frontend** (Mobile App):

   - Loads reCAPTCHA v3 invisibly
   - Executes with action: `register`
   - Gets token automatically
   - Sends token with registration request

2. **Backend** (API):
   - Receives token in request body
   - Calls Google's siteverify API
   - Checks score >= threshold (0.5)
   - Allows/denies registration based on score

## Score Interpretation

reCAPTCHA v3 returns a score from 0.0 to 1.0:

- **1.0**: Very likely a legitimate user
- **0.5**: Threshold (configurable)
- **0.0**: Very likely a bot

Current threshold: **0.5** (balanced approach)

## Testing

### With Real Keys

```bash
# Test registration with reCAPTCHA
curl -X POST http://localhost:3001/api/v5/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "captchaToken": "TOKEN_FROM_FRONTEND"
  }'
```

### Expected Response (Success)

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

### Expected Response (Low Score)

```json
{
  "success": false,
  "error": "reCAPTCHA verification failed",
  "code": "CAPTCHA_FAILED"
}
```

## Production Deployment

Before deploying to production:

1. ✅ Get secret key from Google reCAPTCHA admin
2. ✅ Update `backend/.env` with secret key
3. ✅ Add production domains to reCAPTCHA allowed list:
   - `jewgo.app`
   - `api.jewgo.app`
   - Any other domains
4. ✅ Test registration flow end-to-end
5. ✅ Monitor reCAPTCHA admin console for stats

## Troubleshooting

### "Missing reCAPTCHA token"

- Frontend not sending token
- Check ReCaptchaV3Component is mounted
- Check `onVerify` callback is working

### "reCAPTCHA verification failed"

- Score below threshold
- Invalid token
- Token expired (valid for 2 minutes)
- Wrong secret key

### "Invalid site key"

- Site key doesn't match secret key
- Domain not allowed in reCAPTCHA admin

## Files Modified

- ✅ Frontend: `.env` - Updated with site key
- ✅ Frontend: `src/components/auth/ReCaptchaV3Component.tsx` - Created
- ✅ Frontend: `src/screens/auth/RegisterScreen.tsx` - Updated to use v3
- ⏳ Backend: `backend/.env` - **Needs secret key update**
- ✅ Backend: `backend/src/auth/providers/ReCaptchaProvider.js` - Already supports v3
- ✅ Backend: `backend/src/auth/index.js` - Already configured for v3

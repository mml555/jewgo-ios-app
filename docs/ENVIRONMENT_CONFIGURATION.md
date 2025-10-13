# Environment Configuration Guide

This document explains how to configure environment variables for the JewgoAppFinal mobile application.

## Overview

The mobile app uses `react-native-config` to manage environment variables. All configuration is stored in the `.env` file at the project root.

## Setup

### 1. Create `.env` File

Copy the example file and update with your values:

```bash
cp .env.example .env
```

### 2. Configure API Base URL

The most important variable is `API_BASE_URL`, which determines which backend the app connects to.

**For Production (Render Backend):**

```env
API_BASE_URL=https://jewgo-app-oyoh.onrender.com/api/v5
```

**For Local Development:**

```env
API_BASE_URL=http://localhost:3001/api/v5
```

> ⚠️ **Important**: When using iOS Simulator, `localhost` and `127.0.0.1` refer to the simulator, not your Mac. If testing with a local backend, you may need to use your Mac's IP address instead.

### 3. Other Configuration

```env
# Environment type
NODE_ENV=development

# Enable debug logging
DEBUG_MODE=true

# Google Services (optional)
GOOGLE_PLACES_API_KEY=your_key_here
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here

# Analytics
ENABLE_ANALYTICS=false
ENABLE_PERFORMANCE_MONITORING=false

# ReCAPTCHA
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

## Required Variables

| Variable                        | Required | Description                 | Example                                      |
| ------------------------------- | -------- | --------------------------- | -------------------------------------------- |
| `API_BASE_URL`                  | **Yes**  | Backend API endpoint        | `https://jewgo-app-oyoh.onrender.com/api/v5` |
| `NODE_ENV`                      | No       | Environment type            | `development`, `staging`, `production`       |
| `DEBUG_MODE`                    | No       | Enable debug logs           | `true` or `false`                            |
| `GOOGLE_PLACES_API_KEY`         | No       | Google Places API key       | Your API key                                 |
| `GOOGLE_OAUTH_CLIENT_ID`        | No       | Google OAuth client ID      | Your client ID                               |
| `ENABLE_ANALYTICS`              | No       | Enable analytics            | `true` or `false`                            |
| `ENABLE_PERFORMANCE_MONITORING` | No       | Enable performance tracking | `true` or `false`                            |
| `RECAPTCHA_SITE_KEY`            | No       | ReCAPTCHA site key          | Your site key                                |

## Usage in Code

### Accessing Configuration

```typescript
import { configService } from '../config/ConfigService';

// Get full configuration
const config = configService.getConfig();
console.log(config.apiBaseUrl);

// Or use specific getters
const apiUrl = configService.apiBaseUrl;
const isDebug = configService.debugMode;
```

### Configuration Service Features

The `ConfigService` provides:

- **Singleton Pattern**: Only one instance exists
- **Validation**: Required fields are validated on startup
- **Type Safety**: TypeScript interfaces for all config
- **Debug Logging**: Shows loaded configuration in debug mode

## Rebuilding After Changes

**⚠️ Important**: After modifying `.env`, you MUST rebuild the app!

### iOS

```bash
# Clear cache and rebuild
npm start -- --reset-cache

# In a separate terminal
cd ios
pod install
cd ..
npx react-native run-ios
```

### Android

```bash
# Clear cache and rebuild
npm start -- --reset-cache

# In a separate terminal
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Environment-Specific Builds

You can create multiple `.env` files for different environments:

- `.env` - Default (development)
- `.env.production` - Production build
- `.env.staging` - Staging build

To use a specific environment:

```bash
ENVFILE=.env.production npx react-native run-ios
```

## Troubleshooting

### "API_BASE_URL not found" Error

**Problem**: App crashes with configuration error.

**Solution**:

1. Ensure `.env` file exists in project root
2. Verify `API_BASE_URL` is set in `.env`
3. Rebuild the app (environment changes require rebuild)

### App Still Uses Old URL

**Problem**: Changed `.env` but app uses old configuration.

**Solution**:

```bash
# Clear all caches
npm start -- --reset-cache
rm -rf ios/build
rm -rf android/app/build

# Rebuild
npx react-native run-ios  # or run-android
```

### Network Request Failed

**Problem**: App can't connect to backend.

**Solution**:

1. Verify `API_BASE_URL` is correct in `.env`
2. Test the URL in browser or curl
3. Check firewall settings
4. Verify internet connection

```bash
# Test backend connectivity
curl https://jewgo-app-oyoh.onrender.com/api/v5/health
```

## Security Best Practices

1. **Never commit `.env` to git** - Already in `.gitignore`
2. **Use `.env.example`** for documentation
3. **Rotate API keys regularly**
4. **Use different keys** for development and production
5. **Keep sensitive data** out of version control

## Backend Configuration

The backend is deployed on Render and uses Neon PostgreSQL. Backend configuration is separate and managed through:

- Render Dashboard: Environment variables
- `backend/.env`: Local development
- `backend/src/server.js`: Connection logic

See `docs/deployment/RENDER_DEPLOYMENT_GUIDE.md` for backend setup.

## Related Documentation

- [Deployment Guide](deployment/RENDER_DEPLOYMENT_GUIDE.md)
- [API Testing](../API_ENDPOINTS_TEST_RESULTS.md)
- [Mobile App Fix Summary](../MOBILE_APP_FIX_SUMMARY.md)

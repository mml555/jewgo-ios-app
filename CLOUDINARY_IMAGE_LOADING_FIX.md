# Cloudinary Image Loading Fix

## Problem
Images from Cloudinary links were not loading in the app, showing placeholder images or loading states indefinitely.

## Root Causes Identified

### 1. Image Format Handling
The `transformEntityToLegacyListing` function assumed images would always come as objects with a `url` property, but the backend might return them as plain strings.

### 2. iOS App Transport Security
The Info.plist didn't have explicit exception domains configured for Cloudinary, which could cause iOS to block image loading.

### 3. URL Validation
The `getImageUrl` helper was trying to access `.url` property on already-transformed string URLs, causing undefined values.

## Solutions Implemented

### 1. Updated Image Transformation in `src/services/api.ts`
Added flexible handling for both object and string image formats:

```typescript
// Transform images from backend format to frontend format
const images = entity.images
  ? entity.images.map((img: any) => {
      // Handle both object format {url: "..."} and string format
      if (typeof img === 'string') {
        return img;
      }
      return img.url || img;
    })
  : [];
```

**Why**: Backend might return images in different formats depending on the endpoint or data source.

### 2. Updated Info.plist for iOS
Added Cloudinary domain exceptions to App Transport Security:

```xml
<key>NSExceptionDomains</key>
<dict>
  <key>res.cloudinary.com</key>
  <dict>
    <key>NSExceptionAllowsInsecureHTTPLoads</key>
    <false/>
    <key>NSIncludesSubdomains</key>
    <true/>
    <key>NSExceptionRequiresForwardSecrecy</key>
    <false/>
  </dict>
  <key>cloudinary.com</key>
  <dict>
    <key>NSExceptionAllowsInsecureHTTPLoads</key>
    <false/>
    <key>NSIncludesSubdomains</key>
    <true/>
    <key>NSExceptionRequiresForwardSecrecy</key>
    <false/>
  </dict>
</dict>
```

**Why**: iOS requires explicit permission to load content from external domains, even over HTTPS.

### 3. Improved URL Validation in `src/hooks/useCategoryData.ts`
Updated `getImageUrl` to properly handle string URLs:

```typescript
const getImageUrl = (listing: Listing): string => {
  if (listing.images && listing.images.length > 0) {
    // Images are already transformed to string URLs in api.ts
    const imageUrl = listing.images[0];
    
    // Validate URL
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
      // Check if it's a valid URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
    }
  }
  
  // Fallback to placeholder only if no valid images exist
  return `https://picsum.photos/300/225?random=${listing.id || ''}`;
};
```

**Why**: Ensures only valid HTTP/HTTPS URLs are used, with proper fallback to placeholders.

### 4. Enhanced Debug Logging in `src/components/CategoryCard.tsx`
Added URL logging to image error handler:

```typescript
onError={() => {
  if (__DEV__) {
    debugLog('🖼️ Image load error for', item.title, 'URL:', item.imageUrl);
  }
  // ... retry logic
}
```

**Why**: Helps identify which specific URLs are failing to load during development.

## Testing Checklist

After these changes, test the following:

1. **Cloudinary Images**
   - [ ] Images from `res.cloudinary.com` load correctly
   - [ ] Images from subdomains load correctly
   - [ ] HTTPS Cloudinary URLs work

2. **Fallback Behavior**
   - [ ] Invalid URLs fall back to placeholder
   - [ ] Empty image arrays show placeholder
   - [ ] Null/undefined images show placeholder

3. **Error Handling**
   - [ ] Failed images retry up to 2 times
   - [ ] Error state shows appropriate placeholder
   - [ ] Debug logs show failing URLs

4. **iOS Specific**
   - [ ] Clean build and reinstall app after Info.plist changes
   - [ ] Test on physical device (not just simulator)
   - [ ] Check console for ATS (App Transport Security) errors

## Required Actions

### For iOS
**IMPORTANT**: After updating Info.plist, you must:
1. Clean the build folder in Xcode (Cmd+Shift+K)
2. Delete the app from simulator/device
3. Rebuild and reinstall the app

```bash
# Clean iOS build
cd ios && rm -rf build && cd ..

# Reinstall pods (if needed)
cd ios && pod install && cd ..

# Run fresh build
npx react-native run-ios --simulator="iPhone 16"
```

### For Android
If Android also has issues, update `android/app/src/main/AndroidManifest.xml`:
```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

## Data Flow

```
Backend (images: [{url: "https://res.cloudinary.com/..."}])
  ↓
api.ts transformEntityToLegacyListing (converts to string array)
  ↓
Listing interface (images: string[])
  ↓
useCategoryData getImageUrl (validates and returns first URL)
  ↓
CategoryItem (imageUrl: string)
  ↓
CategoryCard OptimizedImage (loads image)
  ↓
User sees: Cloudinary image or placeholder
```

## Common Issues

### Images Still Not Loading?

1. **Check URL format in console**
   - Look for debug logs showing the actual URLs
   - Verify they start with `https://res.cloudinary.com/`

2. **Verify backend response**
   - Check if backend is returning valid Cloudinary URLs
   - Ensure URLs are not expired or deleted

3. **iOS Simulator vs Device**
   - Simulator might have different network restrictions
   - Always test on a physical device for production validation

4. **Network connectivity**
   - Ensure device/simulator has internet access
   - Check if Cloudinary service is accessible

5. **Image format/size**
   - Very large images might timeout
   - Unsupported formats might fail to load
   - Consider using Cloudinary transformations for optimization

# App Icon Update Guide

This guide explains how to update the Jewgo app icons for both iOS and Android using the new brand design.

## Brand Colors
- **Primary Background**: `#c6ffd1` (light mint green)
- **Icon/Text Color**: `#292b2d` (dark gray/charcoal)

## Source Files
- **Brand SVG**: `jewgo brand concept.svg.svg` (located in project root)
- **Logo Component**: `src/components/JewgoLogo.tsx` (updated)

## iOS App Icons

### Required Sizes
iOS requires multiple icon sizes in the `ios/JewgoAppFinal/Images.xcassets/AppIcon.appiconset/` directory:

| Size | File Name | Usage |
|------|-----------|-------|
| 20x20 @2x | Icon-App-20x20@2x.png | 40x40 px - iPad notifications |
| 20x20 @3x | Icon-App-20x20@3x.png | 60x60 px - iPhone notifications |
| 29x29 @2x | Icon-App-29x29@2x.png | 58x58 px - iPhone/iPad settings |
| 29x29 @3x | Icon-App-29x29@3x.png | 87x87 px - iPhone settings |
| 40x40 @2x | Icon-App-40x40@2x.png | 80x80 px - iPad/iPhone spotlight |
| 40x40 @3x | Icon-App-40x40@3x.png | 120x120 px - iPhone spotlight |
| 60x60 @2x | Icon-App-60x60@2x.png | 120x120 px - iPhone app |
| 60x60 @3x | Icon-App-60x60@3x.png | 180x180 px - iPhone app |
| 1024x1024 @1x | Icon-App-1024x1024@1x.png | 1024x1024 px - App Store |

### How to Generate iOS Icons

1. **Using a Design Tool** (Recommended):
   - Open the SVG in Figma, Adobe Illustrator, or similar
   - Export as PNG at each required size
   - Ensure the background is `#c6ffd1` and icon is `#292b2d`
   - Save with exact file names above

2. **Using Online Icon Generator**:
   - Use services like [appicon.co](https://appicon.co) or [makeappicon.com](https://makeappicon.com)
   - Upload a 1024x1024 PNG of the logo
   - Download the iOS icon pack
   - Replace files in `ios/JewgoAppFinal/Images.xcassets/AppIcon.appiconset/`

3. **Using ImageMagick** (Command Line):
   ```bash
   # Convert SVG to PNG at 1024x1024
   convert "jewgo brand concept.svg.svg" -resize 1024x1024 Icon-App-1024x1024@1x.png
   
   # Generate other sizes
   convert Icon-App-1024x1024@1x.png -resize 40x40 Icon-App-20x20@2x.png
   convert Icon-App-1024x1024@1x.png -resize 60x60 Icon-App-20x20@3x.png
   # ... repeat for all sizes
   ```

### iOS Icon Requirements
- Format: PNG
- Color Space: sRGB or Display P3
- No transparency (iOS will add rounded corners)
- No pre-rendered effects (iOS applies effects automatically)

## Android App Icons

### Required Sizes
Android requires multiple icon sizes in different mipmap folders:

| Density | Folder | Size | File Names |
|---------|--------|------|------------|
| mdpi | mipmap-mdpi/ | 48x48 px | ic_launcher.png, ic_launcher_round.png |
| hdpi | mipmap-hdpi/ | 72x72 px | ic_launcher.png, ic_launcher_round.png |
| xhdpi | mipmap-xhdpi/ | 96x96 px | ic_launcher.png, ic_launcher_round.png |
| xxhdpi | mipmap-xxhdpi/ | 144x144 px | ic_launcher.png, ic_launcher_round.png |
| xxxhdpi | mipmap-xxxhdpi/ | 192x192 px | ic_launcher.png, ic_launcher_round.png |

### Locations
All Android icons are in: `android/app/src/main/res/`

### How to Generate Android Icons

1. **Using Android Studio**:
   - Right-click on `res` folder
   - New → Image Asset
   - Select "Launcher Icons (Adaptive and Legacy)"
   - Upload your 512x512 PNG version of the logo
   - Preview and generate

2. **Using Online Icon Generator**:
   - Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)
   - Upload your logo
   - Configure background color to `#c6ffd1`
   - Generate and download
   - Replace files in respective mipmap folders

3. **Manual Creation**:
   - Create PNG files at each required size
   - Make both square (`ic_launcher.png`) and round (`ic_launcher_round.png`) versions
   - Place in corresponding mipmap density folders

### Android Icon Requirements
- Format: PNG with transparency (optional)
- Two versions needed: square and round
- Adaptive icons recommended (API 26+)
- Background: `#c6ffd1`
- Foreground: `#292b2d` icon design

## Testing the Updated Icons

### iOS
1. Clean build folder: `cd ios && xcodebuild clean`
2. Rebuild: `cd .. && npx react-native run-ios`
3. Check home screen icon
4. Verify in App Switcher

### Android
1. Clean: `cd android && ./gradlew clean`
2. Rebuild: `cd .. && npx react-native run-android`
3. Check home screen icon
4. Verify in app drawer and recent apps

## Design Guidelines

### Logo Design
The new Jewgo logo features a Hebrew-inspired "J" character:
- Clean, modern design
- Culturally relevant
- Easily recognizable at small sizes
- Good contrast for visibility

### Color Psychology
- **Mint Green (#c6ffd1)**: Fresh, welcoming, growth
- **Charcoal (#292b2d)**: Professional, stable, readable

## Notes
- Always test icons on actual devices, not just simulators
- Icons may look different on light vs dark backgrounds
- Consider accessibility - ensure good contrast
- Keep backups of original icons before replacing

## Additional Resources
- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Material Design - Product Icons](https://material.io/design/iconography/product-icons.html)
- [React Native - App Icons](https://reactnative.dev/docs/app-icons)


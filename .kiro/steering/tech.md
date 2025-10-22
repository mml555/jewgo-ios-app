# Technology Stack

## Framework & Runtime

- **React Native**: 0.76.9
- **React**: 18.3.1
- **TypeScript**: Full type safety with @react-native/typescript-config
- **Node.js**: >=20 (required, currently running 22.20.0)

## Navigation & UI Libraries

- **@react-navigation/native**: 7.1.17 - Main navigation system
- **@react-navigation/bottom-tabs**: 7.4.9 - Bottom tab navigation
- **@react-navigation/stack**: 7.4.10 - Stack navigation
- **react-native-safe-area-context**: 5.6.1 - Safe area handling
- **react-native-screens**: 4.4.0 - Native screen optimization
- **react-native-gesture-handler**: 2.20.2 - Touch interactions
- **react-native-svg**: 15.14.0 - Custom logo and icons

## Core Dependencies

- **react-native-google-places-autocomplete**: 2.5.7 - Address autocomplete
- **react-native-geolocation-service**: 5.3.1 - Location services
- **react-native-webview**: 13.16.0 - Web content display
- **react-native-dotenv**: 3.4.11 - Environment variables
- **react-native-maps**: 1.10.0 - Map integration with Google Maps
- **@react-native-google-signin/google-signin**: 16.0.0 - Google authentication

## Additional Libraries

- **@react-native-async-storage/async-storage**: 2.2.0 - Persistent storage
- **@react-native-community/blur**: 4.4.1 - Blur effects
- **@react-native-community/datetimepicker**: 8.4.5 - Date/time picker
- **@react-native-picker/picker**: 2.11.2 - Native picker component
- **react-native-device-info**: 14.0.4 - Device information
- **react-native-document-picker**: 9.3.1 - Document selection
- **react-native-haptic-feedback**: 2.3.3 - Haptic feedback
- **react-native-image-picker**: 8.2.1 - Image selection
- **react-native-permissions**: 5.4.2 - Permission handling
- **react-native-vector-icons**: 10.3.0 - Icon library
- **zustand**: 5.0.2 - State management

## Development Tools

- **ESLint**: @react-native/eslint-config 0.76.9 - Code linting
- **Prettier**: 2.8.8 - Code formatting with custom config
- **Jest**: 29.7.0 - Testing framework
- **TypeScript**: 5.8.3 - Type checking
- **Metro**: @react-native/metro-config 0.76.9 - Bundler
- **Babel**: @react-native/babel-preset 0.76.9 - JavaScript compilation
- **Husky**: 9.1.7 - Git hooks
- **lint-staged**: 16.2.3 - Pre-commit linting
- **patch-package**: 8.0.1 - Package patching

## Code Style Configuration

- **Prettier**: Single quotes, trailing commas, avoid arrow parens
- **ESLint**: Extends @react-native standard configuration
- **Font**: Nunito family set as default for all Text/TextInput components

## Common Commands

### Development

```bash
# Start Metro bundler
npm start
# or
npx react-native start

# Run on iOS simulator
npm run ios
# or
npx react-native run-ios

# Run on specific simulator
npx react-native run-ios --simulator="iPhone 16"

# Clean build with cache reset
npx react-native run-ios --simulator="iPhone 16" --reset-cache
```

### iOS Setup

```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Clean iOS build (if needed)
cd ios && rm -rf build && cd ..
```

### Code Quality

```bash
# Run linter
npm run lint

# Run tests
npm test
# or
jest
```

### Build & Deployment

```bash
# For App Store builds, use Xcode:
# 1. Open ios/JewgoAppFinal.xcworkspace in Xcode
# 2. Select Product > Archive for App Store submission
```

## Environment Setup

- **iOS Development**: Xcode 26.0.1 (Build 17A400)
- **iOS Deployment Target**: 15.1+
- **CocoaPods**: 1.16.2
- **Simulator**: iPhone 16 (primary testing device)
- **Environment Variables**: Managed via .env file with react-native-dotenv
- **Google Maps**: Requires API key configuration in ios/Config/Secrets.\*.xcconfig

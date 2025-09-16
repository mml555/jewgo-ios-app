# Technology Stack

## Framework & Runtime
- **React Native**: 0.81.1
- **React**: 19.1.0
- **TypeScript**: Full type safety with @react-native/typescript-config
- **Node.js**: >=20 (required)

## Navigation & UI Libraries
- **@react-navigation/native**: 7.1.17 - Main navigation system
- **@react-navigation/bottom-tabs**: 7.4.7 - Bottom tab navigation
- **@react-navigation/stack**: 7.4.8 - Stack navigation
- **react-native-safe-area-context**: 5.6.1 - Safe area handling
- **react-native-screens**: 4.16.0 - Native screen optimization
- **react-native-gesture-handler**: 2.28.0 - Touch interactions
- **react-native-svg**: 15.12.1 - Custom logo and icons

## Core Dependencies
- **react-native-google-places-autocomplete**: 2.5.7 - Address autocomplete
- **@react-native-community/geolocation**: 3.4.0 - Location services
- **react-native-webview**: 13.16.0 - Web content display
- **react-native-dotenv**: 3.4.11 - Environment variables

## Development Tools
- **ESLint**: @react-native/eslint-config - Code linting
- **Prettier**: 2.8.8 - Code formatting with custom config
- **Jest**: 29.6.3 - Testing framework
- **TypeScript**: 5.8.3 - Type checking
- **Metro**: @react-native/metro-config - Bundler
- **Babel**: @react-native/babel-preset - JavaScript compilation

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
- **iOS Development**: Xcode 16+ required
- **Simulator**: iPhone 16 (primary testing device)
- **Environment Variables**: Managed via .env file with react-native-dotenv
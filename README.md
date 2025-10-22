# JEWGO - Jewish Community iOS App

A React Native iOS application for the Jewish community, providing easy access to local Jewish businesses, services, and community resources.

## 📚 Documentation

- **[Complete Documentation Index](docs/INDEX.md)** - Find all project documentation
- **[Deployment Status](DEPLOYMENT_STATUS.md)** - Current deployment status
- **[Testing Guide](TESTING_GUIDE.md)** - How to run tests
- **[Deployment Guide](RENDER_NEON_QUICK_FIX.md)** - Deploy to production (Render + Neon)

**iOS Build (Important!)**:
- **[iOS Build Notes](IOS_BUILD_NOTES.md)** - ⚠️ START HERE for iOS setup
- [iOS Quick Start](docs/ios/QUICK_START_IOS.md) - Quick commands
- [iOS Build Fixes](docs/ios/IOS_BUILD_FIXES.md) - Complete technical guide
- [Yoga Explanation](docs/ios/YOGA_EXPLANATION.md) - What is Yoga and why it matters

**Quick Links**:

- [Deployment Checklist](docs/deployment/DEPLOYMENT_CHECKLIST.md)
- [Backend Scripts](backend/scripts/README.md)
- [Database Setup](database/README_EVENTS_SEEDING.md)
- [Architecture Guide](docs/developer/ARCHITECTURE.md)

---

## 🏗️ Features

### Core Functionality

- **Bottom Tab Navigation**: Home, Favorites, Specials, Notifications, Profile
- **Search Functionality**: Debounced search with real-time filtering
- **Category System**: 8 categories (Mikvah, Eatery, Shul, Stores, Shuk, Shtetl, Events, Jobs)
- **Grid Layout**: 2-column responsive grid with infinite scroll
- **Pull-to-Refresh**: Smooth refresh functionality
- **Detailed Views**: Comprehensive listing detail pages

### User Interface

- **Custom Branding**: JEWGO logo and app icon integration
- **Modern Design**: Clean, iOS-native interface
- **Accessibility**: Full accessibility support with proper labels and touch targets
- **Performance**: Optimized with React.memo, useCallback, and efficient rendering

### Listing Features

- **Image Carousels**: Swipeable image galleries
- **Reviews System**: Comprehensive review modal with sorting and pagination
- **Hours Display**: Dynamic hours with open/closed status
- **Contact Actions**: Call, Website, Email integration
- **Favorites**: Heart button with persistent state
- **Location**: Distance calculation and address display

## 🛠️ Technical Stack

- **React Native 0.73**: Latest stable version
- **TypeScript**: Full type safety
- **React Navigation**: Tab and stack navigation
- **React Native SVG**: Custom logo and icon components
- **React Native Safe Area Context**: Safe area handling
- **iOS 18.5**: Compatible with latest iOS versions

## 📱 Screenshots

The app features:

- Custom JEWGO branding with green color scheme
- Category-based browsing with horizontal scroll
- Action buttons for Live Map, Add Category, and Filters
- Card-based listing display with images and ratings
- Detailed listing pages with comprehensive information

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- Xcode 16+ (for iOS development)
- iOS Simulator or physical iOS device

### Quick Start (Recommended)

**One command to start everything:**

```bash
./scripts/start-dev.sh
```

This script will automatically:

- ✅ Start Docker services (PostgreSQL, Redis, Mailhog)
- ✅ Start backend API server
- ✅ Start Metro bundler
- ✅ Build and launch iOS app

**Stop everything:**

```bash
./scripts/stop-dev.sh
```

### Manual Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/jewgo-ios-app.git
   cd jewgo-ios-app
   ```

2. **Start Docker services**

   ```bash
   docker-compose up -d
   ```

3. **Install and start backend**

   ```bash
   cd backend
   npm install
   npm start
   ```

4. **Install and start frontend**

   ```bash
   cd ..
   npm install
   cd ios && pod install && cd ..
   npx react-native start
   ```

5. **Run the app**
   ```bash
   npx react-native run-ios
   ```

### Development

- **Start everything**: `./scripts/start-dev.sh`
- **Stop everything**: `./scripts/stop-dev.sh`
- **Start Metro bundler**: `npx react-native start`
- **Run on iOS**: `npx react-native run-ios --simulator="iPhone 16"`
- **Clean build**: `npx react-native run-ios --simulator="iPhone 16" --reset-cache`

#### Fast Pods/Xcode Validation

Before a full clean rebuild, run the quick validator to catch common configuration issues and optionally build specific pods:

```bash
# Basic checks (xcconfig scan, headers, Podfile.lock vs Pods/)
npm run ios:pods:validate

# Include quick builds for Google Maps-related pods
npm run ios:pods:validate:maps
```

You can also target individual schemes:

```bash
bash scripts/ios-validate-pods.sh --build-scheme 'Google-Maps-iOS-Utils' --build-scheme 'react-native-google-maps'
```

What it checks:
- Pod workspace usage and presence of `Pods/` and `Podfile.lock`
- Suspicious flags in `.xcconfig` (e.g., `-fmodule-map-file`)
- Header symlink structure
- `Podfile.lock` vs. resolved pods in `Pods/`
- Optional quick-build of selected pod schemes using a generic iOS Simulator destination

When to run:
- After adding/updating a native pod or changing `Podfile`
- After switching branches that modify iOS native configs or pods
- When Xcode shows header/module map errors or link errors

#### Environment & Schemes Helpers

```bash
# Environment diagnostics + native config + top-level package health
npm run env:check

# List all workspace schemes (JSON)
npm run ios:schemes:list
```

For detailed setup instructions, see [Development Setup Guide](docs/developer/DEVELOPMENT_SETUP.md).

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ActionBar.tsx   # Action buttons (Live Map, Add Category, Filters)
│   ├── CategoryCard.tsx # Individual listing cards
│   ├── CategoryRail.tsx # Horizontal category scroll
│   ├── JewgoLogo.tsx   # Custom JEWGO logo component
│   └── TopBar.tsx      # Search bar and logo
├── hooks/              # Custom React hooks
│   └── useCategoryData.ts # Data fetching and pagination
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx # Main stack navigator
│   └── RootTabs.tsx    # Bottom tab navigator
└── screens/           # Screen components
    ├── HomeScreen.tsx  # Main home screen
    ├── CategoryGridScreen.tsx # Category listing grid
    ├── ListingDetailScreen.tsx # Detailed listing view
    ├── ProfileScreen.tsx # User profile
    └── ...            # Other screens
```

## 🎨 Design System

### Colors

- **Primary Green**: `#74e1a0` (JEWGO logo)
- **Light Green**: `#a5ffc6` (App icon)
- **Dark Background**: `#292b2d` (Logo background)
- **Background**: `#F2F2F7` (iOS system gray)
- **Text**: `#000000` (Primary), `#666666` (Secondary)

### Typography

- **System Font**: iOS San Francisco font family
- **Sizes**: 12px (small), 14px (body), 16px (large), 18px+ (headers)

### Components

- **Cards**: Rounded corners, subtle shadows, floating design
- **Buttons**: Pill-shaped with proper touch targets (44px minimum)
- **Icons**: Unicode characters and custom SVG components

## 🔧 Configuration

### iOS Setup

- **Deployment Target**: iOS 13.0+
- **Xcode Version**: 16+
- **Simulator**: iPhone 16 (tested)
- **App Icon**: Custom JEWGO logo integrated

### Dependencies

- `react-native-svg`: Custom logo rendering
- `react-native-safe-area-context`: Safe area handling
- `react-native-screens`: Navigation optimization
- `react-native-gesture-handler`: Touch interactions

## 📋 Features in Detail

### Category System

- **Mikvah**: Ritual baths and facilities
- **Eatery**: Kosher restaurants and food
- **Shul**: Synagogues and prayer spaces
- **Stores**: Jewish retail and services
- **Shuk**: Markets and shopping
- **Shtetl**: Community centers
- **Events**: Community events and gatherings
- **Jobs**: Employment opportunities

### Search & Filtering

- **Real-time Search**: 250ms debounced input
- **Category Filtering**: Dynamic content based on selection
- **Infinite Scroll**: Efficient pagination
- **Pull-to-Refresh**: Manual data refresh

### Listing Details

- **Image Gallery**: Up to 5 swipeable images
- **Reviews Modal**: Sortable reviews with pagination
- **Hours Display**: Current status with weekly schedule
- **Contact Integration**: Direct call, website, email access
- **Location Services**: Distance calculation and mapping

## 🚀 Deployment

**Current Production Setup**: Render (Backend) + Neon (Database)

### Quick Deployment

**Backend URL**: https://jewgo-app-oyoh.onrender.com

**Need to deploy or fix issues?**

1. **[Render + Neon Quick Fix](RENDER_NEON_QUICK_FIX.md)** - Fix deployment issues (20 min)
2. **[Deployment Checklist](docs/deployment/DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
3. **[Backend Scripts](backend/scripts/README.md)** - Deployment automation scripts

### iOS App Store

```bash
# Development build
npx react-native run-ios

# Production build (requires Xcode)
# 1. Open ios/JewgoAppFinal.xcworkspace in Xcode
# 2. Select Product > Archive for App Store submission
# 3. Follow App Store Connect upload process
```

**App Store Readiness**:

- ✅ App icon assets (all sizes)
- ✅ iOS bundle configuration
- ✅ Accessibility compliance
- ✅ Performance optimized
- ✅ Error handling & crash prevention

### Backend Deployment

**Platform**: Render + Neon PostgreSQL

**Quick Commands**:

```bash
# Generate JWT secrets
./backend/scripts/generate-jwt-secrets.sh

# Initialize Neon database
export DATABASE_URL="<neon-connection-string>"
./backend/scripts/render-init-db.sh

# Health check
./backend/scripts/health-check.sh https://jewgo-app-oyoh.onrender.com
```

See **[Backend Scripts README](backend/scripts/README.md)** for full documentation.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- CategoryGridScreen.test.tsx

# Run with coverage
npm test -- --coverage

# Run integration tests
npm run test:integration
```

See **[Testing Guide](TESTING_GUIDE.md)** for detailed testing documentation.

---

## 📁 Project Structure

```
jewgo-ios-app/
├── src/                    # React Native source code
│   ├── components/         # Reusable components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API and business logic
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── backend/                # Node.js backend API
│   ├── src/                # Backend source code
│   ├── scripts/            # Deployment & utility scripts
│   └── migrations/         # Database migrations
├── database/               # Database setup & migrations
│   ├── init/               # Initial schema
│   └── migrations/         # Schema changes
├── docs/                   # Project documentation
│   ├── deployment/         # Deployment guides
│   ├── developer/          # Developer documentation
│   ├── database/           # Database documentation
│   └── archive/            # Historical docs
└── ios/                    # iOS native code

```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Developer Resources**:

- [Architecture Guide](docs/developer/ARCHITECTURE.md)
- [Component Guide](docs/developer/COMPONENTS.md)
- [Code Style Guide](docs/developer/CODE_STYLE.md)
- [Git Workflow](docs/developer/GIT_WORKFLOW.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native community for excellent documentation
- iOS design guidelines for UI/UX inspiration
- Jewish community for feedback and requirements

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**JEWGO** - Connecting the Jewish community, one tap at a time. 🕍

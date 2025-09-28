# JEWGO - Jewish Community iOS App

A React Native iOS application for the Jewish community, providing easy access to local Jewish businesses, services, and community resources.

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

### App Store Preparation
- App icon assets generated for all required sizes
- Proper iOS bundle configuration
- Accessibility compliance
- Performance optimizations

### Build Process
```bash
# Development build
npx react-native run-ios

# Production build (requires Xcode)
# Open ios/JewgoAppFinal.xcworkspace in Xcode
# Select Product > Archive for App Store submission
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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
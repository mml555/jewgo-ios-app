# Project Structure

## Root Directory Organization
```
├── src/                    # Main source code
├── ios/                    # iOS native code and configuration
├── android/               # Android native code (present but iOS-focused)
├── __tests__/             # Test files
├── node_modules/          # Dependencies
└── [config files]         # Various configuration files
```

## Source Code Structure (`src/`)

### Core Directories
- **`components/`** - Reusable UI components
- **`screens/`** - Screen-level components (full pages)
- **`navigation/`** - Navigation configuration and setup
- **`hooks/`** - Custom React hooks for shared logic
- **`services/`** - API and external service integrations
- **`styles/`** - Design system and styling constants
- **`types/`** - TypeScript type definitions
- **`config/`** - App configuration files

### Component Organization
```
src/components/
├── ActionBar.tsx           # Live Map, Add Category, Filters buttons
├── CategoryCard.tsx        # Individual business listing cards
├── CategoryRail.tsx        # Horizontal scrolling category selector
├── TopBar.tsx             # Search bar and logo header
├── JewgoLogo.tsx          # Custom SVG logo component
├── *Icon.tsx              # Various icon components (social media, etc.)
├── *Modal.tsx             # Modal components (Reviews, Filters, etc.)
└── AddCategoryForm/       # Multi-step form components
    ├── BasicInfoPage.tsx
    ├── HoursServicesPage.tsx
    ├── KosherPricingPage.tsx
    ├── LocationContactPage.tsx
    └── PhotosReviewPage.tsx
```

### Screen Components
```
src/screens/
├── HomeScreen.tsx          # Main landing page with categories
├── CategoryGridScreen.tsx  # Grid view of business listings
├── ListingDetailScreen.tsx # Detailed business information
├── AddCategoryScreen.tsx   # Add new business form
├── FavoritesScreen.tsx     # User's saved businesses
├── SpecialsScreen.tsx      # Special offers and deals
├── LiveMapScreen.tsx       # Map view of businesses
├── ProfileScreen.tsx       # User profile and settings
├── SettingsScreen.tsx      # App settings
└── NotificationsScreen.tsx # Push notifications
```

### Navigation Structure
```
src/navigation/
├── AppNavigator.tsx        # Main stack navigator setup
└── RootTabs.tsx           # Bottom tab navigation configuration
```

## Design System Location
- **`src/styles/designSystem.ts`** - Centralized design tokens including:
  - Colors (primary: #2D5016, accent: #74E1A0)
  - Typography (Nunito font family)
  - Spacing (8px grid system)
  - Component styles
  - Shadows and border radius

## Key Architectural Patterns

### Component Naming
- **Screens**: `*Screen.tsx` (e.g., `HomeScreen.tsx`)
- **Components**: PascalCase descriptive names (e.g., `CategoryCard.tsx`)
- **Icons**: `*Icon.tsx` (e.g., `FacebookIcon.tsx`)
- **Modals**: `*Modal.tsx` (e.g., `ReviewsModal.tsx`)

### File Organization Rules
- One component per file
- Co-locate related components in subdirectories when they form a logical group
- Use TypeScript for all components (.tsx extension)
- Export default for main component, named exports for utilities

### Import Patterns
- React Navigation components imported from specific packages
- Design system imported from `src/styles/designSystem`
- Custom hooks imported from `src/hooks/`
- Services imported from `src/services/`

### State Management
- Local component state with useState/useReducer
- Custom hooks for shared logic (e.g., `useCategoryData.ts`)
- No global state management library (Redux/Context) currently used

### Performance Patterns
- React.memo for expensive components
- useCallback for event handlers
- Efficient FlatList usage for large datasets
- Image optimization and lazy loading

## Configuration Files
- **`app.json`** - React Native app configuration
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`.eslintrc.js`** - ESLint rules
- **`.prettierrc.js`** - Code formatting rules
- **`babel.config.js`** - Babel configuration with dotenv plugin
- **`metro.config.js`** - Metro bundler configuration
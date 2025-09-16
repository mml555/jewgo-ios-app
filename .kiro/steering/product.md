# Product Overview

JEWGO is a React Native iOS application designed for the Jewish community, providing easy access to local Jewish businesses, services, and community resources.

## Core Purpose
Connect Jewish community members with local businesses and services through a modern, accessible mobile interface.

## Key Features
- **Category-based browsing**: 8 main categories (Mikvah, Eatery, Shul, Stores, Shuk, Shtetl, Shidduch, Social)
- **Search and filtering**: Real-time search with debounced input (250ms)
- **Location services**: Distance calculation and mapping integration
- **Reviews system**: Comprehensive review modal with sorting and pagination
- **Favorites**: Persistent favorites with heart button interaction
- **Business listings**: Detailed pages with images, hours, contact info

## Target Platform
- **Primary**: iOS (iPhone)
- **Minimum iOS**: 13.0+
- **Tested on**: iPhone 16 simulator

## Design Philosophy
- Clean, iOS-native interface following Apple's design guidelines
- Accessibility-first approach with proper labels and touch targets
- Performance-optimized with React.memo, useCallback, and efficient rendering
- Green color scheme (#2D5016 primary, #74E1A0 accent) reflecting Jewish community branding

## User Experience
- Bottom tab navigation for main sections
- Pull-to-refresh functionality
- Infinite scroll for listings
- Swipeable image galleries
- Direct contact integration (call, website, email)
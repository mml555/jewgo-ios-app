# Design Document

## Overview

This design addresses the systematic investigation and resolution of build issues and LiveMap page failures in the JEWGO React Native iOS application. The solution focuses on build system reliability, map component architecture, and robust error handling to ensure consistent development and user experiences.

## Architecture

### Build System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Pipeline                           │
├─────────────────────────────────────────────────────────────┤
│  React Native CLI → CocoaPods → Xcode Build → iOS Simulator │
│                                                             │
│  Key Components:                                            │
│  • Podfile with rsync fixes                                │
│  • Hermes engine configuration                             │
│  • Framework dependency resolution                         │
│  • Sandbox-safe build scripts                              │
└─────────────────────────────────────────────────────────────┘
```

### LiveMap Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   LiveMapScreen                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Search Bar    │  │   Filter Modal  │  │   Legend     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                NativeMapView                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │ │
│  │  │ Clustering  │  │   Markers   │  │   User Location │  │ │
│  │  │   System    │  │  Component  │  │    Tracking     │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Business Details Popup                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Build System Components

#### 1. Enhanced Podfile Configuration

- **Purpose**: Resolve rsync sandbox issues and framework conflicts
- **Key Features**:
  - Absolute path rsync replacement (`/usr/bin/rsync`)
  - Hermes engine disabling for sandbox compatibility
  - Framework copy script modifications
  - Deployment target standardization

#### 2. Build Diagnostic System

- **Purpose**: Provide clear error reporting and troubleshooting guidance
- **Components**:
  - Build log analysis
  - Common error pattern detection
  - Automated fix suggestions
  - Environment validation

### LiveMap System Components

#### 1. NativeMapView Component

```typescript
interface NativeMapViewProps {
  points: MapPoint[];
  initialRegion: Region;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  onMarkerPress?: (point: MapPoint) => void;
}
```

#### 2. Map Clustering System

```typescript
interface ClusteringConfig {
  radius: number; // 58px cluster radius
  maxZoom: number; // 20 max zoom level
  minZoom: number; // 0 min zoom level
  minPoints: number; // 2 minimum points to cluster
}
```

#### 3. Marker Components

- **ListingMarker**: Individual business location markers
- **ClusterMarker**: Grouped marker clusters with count display
- **UserLocationMarker**: Current user position indicator

#### 4. Business Details Popup

```typescript
interface PopupData {
  id: string;
  title: string;
  description: string;
  category: string;
  rating?: number;
  imageUrl?: string;
  distance?: string;
}
```

## Data Models

### MapPoint Interface

```typescript
interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}
```

### Build Configuration Model

```typescript
interface BuildConfig {
  hermesEnabled: boolean;
  useAbsolutePaths: boolean;
  deploymentTarget: string;
  frameworkCopyMethod: 'rsync' | 'ditto' | 'cp';
  sandboxCompatible: boolean;
}
```

### Error Handling Models

```typescript
interface BuildError {
  type: 'rsync' | 'framework' | 'dependency' | 'compilation';
  message: string;
  suggestedFix: string;
  severity: 'error' | 'warning' | 'info';
}

interface MapError {
  type: 'clustering' | 'rendering' | 'data' | 'permissions';
  component: string;
  fallbackAction: string;
}
```

## Error Handling

### Build Error Recovery

1. **Rsync Sandbox Errors**

   - Detection: Monitor build logs for sandbox violation patterns
   - Resolution: Replace with absolute path `/usr/bin/rsync`
   - Fallback: Use `ditto` command for file copying

2. **Framework Copy Failures**

   - Detection: Framework installation errors in CocoaPods
   - Resolution: Disable problematic framework copying
   - Fallback: Manual framework linking

3. **Dependency Conflicts**
   - Detection: Version mismatch warnings
   - Resolution: Lock compatible versions in Podfile
   - Fallback: Exclude conflicting dependencies

### LiveMap Error Handling

1. **Map Rendering Failures**

   - Detection: Component mount errors or blank map display
   - Resolution: Fallback to basic MapView without clustering
   - User Feedback: "Map loading..." indicator with retry option

2. **Clustering System Failures**

   - Detection: Supercluster initialization errors
   - Resolution: Display individual markers without clustering
   - Performance: Limit marker count to prevent performance issues

3. **Data Loading Errors**

   - Detection: API failures or malformed data
   - Resolution: Show cached data or test markers
   - User Feedback: "Unable to load locations" with refresh button

4. **Location Permission Issues**
   - Detection: Geolocation permission denied
   - Resolution: Use default region (NYC area)
   - User Guidance: Permission request modal with instructions

## Testing Strategy

### Build System Testing

1. **Clean Build Tests**

   - Fresh clone build verification
   - Different Xcode version compatibility
   - CocoaPods cache clearing scenarios

2. **Error Simulation Tests**
   - Intentional rsync path corruption
   - Framework dependency conflicts
   - Hermes configuration variations

### LiveMap Component Testing

1. **Unit Tests**

   - Clustering algorithm accuracy
   - Marker rendering with various data sets
   - Popup interaction handling

2. **Integration Tests**

   - Map component with real API data
   - Filter and search functionality
   - User location tracking accuracy

3. **Performance Tests**
   - Large dataset rendering (1000+ markers)
   - Zoom/pan responsiveness
   - Memory usage monitoring

### Error Handling Tests

1. **Build Recovery Tests**

   - Automatic error detection and fixing
   - Fallback mechanism validation
   - User guidance effectiveness

2. **Map Resilience Tests**
   - Network failure scenarios
   - Malformed data handling
   - Component crash recovery

## Implementation Approach

### Phase 1: Build System Stabilization

1. Analyze current build failures and patterns
2. Implement enhanced Podfile configurations
3. Add build diagnostic and recovery systems
4. Validate across different development environments

### Phase 2: LiveMap Component Audit

1. Verify all map-related dependencies and imports
2. Test clustering system with various data scenarios
3. Implement missing marker components if needed
4. Add comprehensive error boundaries

### Phase 3: Error Handling Enhancement

1. Implement robust error detection systems
2. Add user-friendly error messages and recovery options
3. Create fallback mechanisms for critical failures
4. Add detailed logging for debugging

### Phase 4: Performance Optimization

1. Optimize map rendering performance
2. Implement efficient data loading strategies
3. Add caching mechanisms for map data
4. Monitor and optimize memory usage

## Success Metrics

### Build System Success

- 100% successful builds on clean environments
- < 5 minute build times for incremental builds
- Zero rsync-related sandbox errors
- Automated error recovery rate > 90%

### LiveMap Functionality Success

- Map loads within 3 seconds on average
- Clustering works correctly with 500+ markers
- Zero crashes during normal map interactions
- User location accuracy within 100 meters

### Error Handling Success

- All error scenarios have defined recovery paths
- User-facing error messages are actionable
- Fallback mechanisms maintain core functionality
- Debug information is comprehensive and useful

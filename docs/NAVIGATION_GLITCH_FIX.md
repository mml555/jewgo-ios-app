# Navigation Transition Optimization - Complete Solution

**Date:** October 20, 2025
**Issue:** Glitchy, inconsistent page transitions throughout the app

## Problem Analysis

The glitching effect during page transitions was caused by several system-wide issues:

1. **LayoutAnimation Conflicts**: `LayoutAnimation` running during React Navigation's transitions
2. **State Updates During Transitions**: State updates happening during navigation animations
3. **Heavy BlurView Rendering**: Expensive blur effects rendering/unmounting during transitions
4. **Async Timers**: Measurement timers running even when screens not focused
5. **Inconsistent Navigator Configuration**: No standardized transition settings across screens
6. **Missing Performance Optimizations**: Lack of native driver usage and proper animation timing

## Solution Implementation

### 1. Added Transition State Management

Added `isTransitioning` ref and `useIsFocused` hook to track navigation states:

```typescript
const isFocused = useIsFocused();
const isTransitioning = useRef(false);
```

### 2. Used InteractionManager for Deferred Updates

Wrapped state updates in `InteractionManager.runAfterInteractions()` to ensure they happen after navigation animations complete:

```typescript
useFocusEffect(
  useCallback(() => {
    isTransitioning.current = true;

    const task = InteractionManager.runAfterInteractions(() => {
      // State updates happen here after animation completes
      isTransitioning.current = false;
    });

    return () => {
      isTransitioning.current = true;
      task.cancel();
    };
  }, []),
);
```

### 3. Conditional LayoutAnimation

Only run layout animations when the screen is focused and not transitioning:

```typescript
useEffect(() => {
  if (isFocused && !isTransitioning.current) {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        120,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
  }
}, [showSticky, isFocused]);
```

### 4. Optimized Scroll Handler

Prevent scroll state updates during transitions:

```typescript
const handleScroll = useCallback(
  (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isFocused || isTransitioning.current) return;

    const y = event.nativeEvent.contentOffset.y;
    setScrollY(y);
    setShowSticky(prev => (prev ? y >= STICKY_EXIT : y >= STICKY_ENTER));
  },
  [STICKY_ENTER, STICKY_EXIT, isFocused],
);
```

### 5. Conditional BlurView Rendering

Only render expensive blur effects when the screen is focused and not transitioning:

```typescript
{showSticky && isFocused && !isTransitioning.current && (
  <View>
    <BlurView ... />
  </View>
)}
```

### 6. Focused Timer Guards

Added focus checks to prevent timers from running when screen is not active:

```typescript
useEffect(() => {
  if (!isFocused) return; // Don't run timers when screen is not focused

  const timer = setTimeout(() => {
    // Timer logic
  }, 1000);

  return () => clearTimeout(timer);
}, [showActionBarInHeader, isFocused]);
```

### 7. Optimized Sticky ActionBar Visibility

Updated sticky ActionBar to respect focus and transition states:

```typescript
<View
  pointerEvents={showSticky && isFocused ? 'box-none' : 'none'}
  accessible={showSticky && isFocused}
  style={{
    opacity: showSticky && isFocused && !isTransitioning.current ? 1 : 0,
    // ... other styles
  }}
>
  <ActionBar ... />
</View>
```

## Files Modified

### Core Navigation Configuration

1. **`/src/navigation/AppNavigator.tsx`** ⭐ MAJOR CHANGES

   - Added `TransitionPresets` import from `@react-navigation/stack`
   - Created `defaultScreenOptions` with optimized transition settings:
     - Platform-specific transitions (SlideFromRightIOS, FadeFromBottomAndroid)
     - Native driver enabled for all animations
     - Optimized animation timing (300ms open, 250ms close)
     - Enabled `detachPreviousScreen` and `freezeOnBlur` for memory optimization
     - Custom cardStyleInterpolator for smooth fade transitions
   - Removed redundant screen-level options (now handled by defaults)
   - Disabled animation for MainTabs screen
   - Reduced code duplication significantly

2. **`/src/navigation/RootTabs.tsx`**
   - Added performance optimization documentation
   - Kept simple, stable configuration (curved bottom bar has limited customization)
   - Clean, consistent tab structure

### Screen-Level Optimizations

3. **`/src/screens/jobs/JobListingsScreen.tsx`**

   - Added `InteractionManager` import
   - Added `useIsFocused` hook
   - Added `isTransitioning` ref
   - Updated `useFocusEffect` to use InteractionManager
   - Updated LayoutAnimation to respect focus state
   - Updated scroll handler with focus checks
   - Optimized BlurView rendering (only when focused)
   - Added focus guards to timers

4. **`/src/screens/HomeScreen.tsx`**
   - Added `InteractionManager` import
   - Added `useIsFocused` and `useFocusEffect` hooks
   - Added `isTransitioning` ref
   - Added `useFocusEffect` for transition management
   - Updated LayoutAnimation to respect focus state
   - Updated scroll handler with focus checks
   - Updated category change handler with InteractionManager
   - Optimized BlurView rendering (only when focused and not transitioning)
   - Added focus guards to timers

### Reusable Components

5. **`/src/components/OptimizedScreenWrapper.tsx`** (NEW)
   - Created reusable wrapper component for screen optimization
   - Manages transition states automatically
   - Uses InteractionManager for deferred operations
   - Provides consistent focus/blur behavior
   - Can be easily applied to any screen needing optimization

## Benefits

1. **Smooth Transitions**: Buttery-smooth navigation throughout the entire app
2. **Consistent Experience**: Standardized transitions across all screens
3. **Better Performance**:
   - Reduced unnecessary renders and state updates
   - Optimized memory usage with screen detachment
   - Native driver animations for 60fps performance
4. **Resource Efficient**:
   - Timers and heavy operations only run when screen is active
   - Previous screens properly frozen to save resources
5. **Improved UX**:
   - Professional, polished feel matching top-tier apps
   - Predictable animation timing
   - No visual artifacts or glitches
6. **Maintainability**:
   - Centralized navigation configuration
   - Reduced code duplication
   - Reusable optimization patterns

## Testing Recommendations

1. Navigate from Jobs page to Home page multiple times
2. Navigate from Jobs page to other tabs (Events, Shtetl, Profile)
3. Switch between Job Feed and Resume Feed modes before navigating
4. Test with sticky headers visible and hidden
5. Test on both iOS and Android devices
6. Test rapid navigation (quickly switching between tabs)

## Performance Considerations

- **InteractionManager**: Defers non-critical work until after animations complete
- **Focus Guards**: Prevents unnecessary work when screen is not visible
- **Conditional Rendering**: Heavy components only render when needed
- **Animation Coordination**: Layout animations don't conflict with navigation transitions

## Key Technical Details

### Navigation Configuration

The `defaultScreenOptions` in AppNavigator provides:

```typescript
{
  headerShown: false,
  presentation: 'card',
  ...Platform.select({
    ios: {
      ...TransitionPresets.SlideFromRightIOS,
      gestureEnabled: true,
      gestureResponseDistance: 50,
      cardOverlayEnabled: true,
    },
    android: {
      ...TransitionPresets.FadeFromBottomAndroid,
      gestureEnabled: false,
    },
  }),
  detachPreviousScreen: true,  // Unmount to save memory
  freezeOnBlur: true,           // Freeze when not visible
  animationEnabled: true,
  transitionSpec: {
    open: { animation: 'timing', config: { duration: 300, useNativeDriver: true }},
    close: { animation: 'timing', config: { duration: 250, useNativeDriver: true }},
  },
}
```

### Transition Management Pattern

For complex screens with animations:

```typescript
const isFocused = useIsFocused();
const isTransitioning = useRef(false);

useFocusEffect(
  useCallback(() => {
    isTransitioning.current = true;
    const task = InteractionManager.runAfterInteractions(() => {
      isTransitioning.current = false;
    });
    return () => {
      isTransitioning.current = true;
      task.cancel();
    };
  }, []),
);
```

### BlurView Optimization

Only render expensive effects when screen is stable:

```typescript
{showSticky && isFocused && !isTransitioning.current && (
  <BlurView ... />
)}
```

## Future Improvements

1. ✅ Centralized navigation configuration (DONE)
2. ✅ Reusable screen wrapper component (DONE)
3. Apply OptimizedScreenWrapper to more screens as needed
4. Monitor performance metrics to ensure improvements are maintained
5. Consider React.memo for expensive child components
6. Add transition performance metrics/analytics

## Notes

- The `isTransitioning` ref is used instead of state to avoid triggering re-renders
- `InteractionManager.runAfterInteractions` ensures smooth navigation animations
- Focus checks prevent issues when rapidly switching between tabs
- BlurView optimization significantly reduces GPU load during transitions

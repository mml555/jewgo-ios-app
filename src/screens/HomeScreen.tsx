import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
  InteractionManager,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useIsFocused,
  useFocusEffect,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from '@react-native-community/blur';
import TopBar from '../components/TopBar';
import ActionBar from '../components/ActionBar';
import StickyDebugOverlay from '../components/StickyDebugOverlay';
import GridListScrollHeader, {
  GridListScrollHeaderRef,
} from '../components/GridListScrollHeader';
import { useCategoryGridRenderProps } from './CategoryGridScreen';
import { SkeletonGrid } from '../components/SkeletonLoader';
import JobListingsScreen from './jobs/JobListingsScreen';
import type { AppStackParamList } from '../types/navigation';
import { Colors, StickyLayout } from '../styles/designSystem';
import { debugLog, errorLog } from '../utils/logger';
import { useLocation } from '../hooks/useLocation';
import { getGridColumns, getGridCardDimensions, useResponsiveDimensions } from '../utils/deviceAdaptation';

interface HomeScreenProps {
  onSearchChange?: (query: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSearchChange }) => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const headerRailRef = useRef<GridListScrollHeaderRef>(null);
  const isFocused = useIsFocused();
  const isTransitioning = useRef(false);
  
  // Responsive dimensions
  const { width: screenWidth, isTablet } = useResponsiveDimensions();

  // Core state
  const [activeCategory, setActiveCategory] = useState('mikvah');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobMode, setJobMode] = useState<'seeking' | 'hiring'>('hiring');

  // Scroll-away section height (Rail + ActionBar + Banner) - NOT including TopBar
  const restHeaderHRef = useRef(0); // LOCKED resting header height (never changes after first measurement)
  const [scrollHeaderH, setScrollHeaderH] = useState(0); // For debug overlay only

  // Scroll state
  const [scrollY, setScrollY] = useState(0);
  const [showSticky, setShowSticky] = useState(false);

  // Clear intent: ActionBar placement
  // Show ActionBar in header when NOT sticky (rest state)
  // Initially true to allow measurement, then controlled by scroll position
  const showActionBarInHeader = !showSticky;

  // Location hooks
  const {
    location,
    requestLocationPermission,
    permissionGranted,
    getCurrentLocation,
  } = useLocation();

  // Handle category navigation from route params (from Favorites screen)
  useEffect(() => {
    const params = route.params as { category?: string } | undefined;
    if (params?.category) {
      debugLog('🔍 HomeScreen received category param:', params.category);
      setActiveCategory(params.category);
      // Clear the param after handling it
      navigation.setParams({ category: undefined } as any);
    }
  }, [route.params, navigation]);

  // Manage transition state during focus/blur
  useFocusEffect(
    useCallback(() => {
      // Mark as transitioning during navigation
      isTransitioning.current = true;

      // Use InteractionManager to clear transition flag after animation
      const task = InteractionManager.runAfterInteractions(() => {
        debugLog('🧭 HomeScreen focused');
        isTransitioning.current = false;
      });

      return () => {
        debugLog('👋 HomeScreen blurred');
        isTransitioning.current = true;
        task.cancel();
      };
    }, []),
  );

  // Live measurements - single source of truth (no more magic numbers!)
  const SAFE_TOP = insets.top;
  const [searchHeight, setSearchHeight] = useState(0);
  const [actionBarHeight, setActionBarHeight] = useState(0);
  const GAP = StickyLayout.laneGap; // Shared gap between TopBar and the next lane

  // The TopBar already reports its height including safe area padding, so do
  // not double count SAFE_TOP. Fallback to design tokens until we measure.
  const topBarHeight =
    searchHeight > 0 ? searchHeight : SAFE_TOP + StickyLayout.searchBarHeight;
  const measuredActionBarHeight =
    actionBarHeight > 0 ? actionBarHeight : StickyLayout.actionBarHeight;
  const stickyLaneOffset = topBarHeight + GAP;
  // Single source of truth for sticky height (TopBar + gap + ActionBar)
  const stickyH = stickyLaneOffset + measuredActionBarHeight;

  // FlatList padding equals the area permanently occupied by TopBar + gap.
  const listPaddingTop = stickyLaneOffset;
  const stickyGridInset = showSticky ? StickyLayout.overlayGridInset : 0;
  const gridPaddingTop = listPaddingTop + stickyGridInset;

  // How much of the scroll header must pass before ActionBar reaches the TopBar
  const headerPreActionHeight =
    scrollHeaderH > 0
      ? Math.max(0, scrollHeaderH - measuredActionBarHeight)
      : StickyLayout.categoryRailHeightDefault + StickyLayout.railActionGap;

  // Threshold where sticky state begins (TopBar height + gap + category rail)
  const THRESHOLD_BASE = topBarHeight + headerPreActionHeight;
  const revealOffset = StickyLayout.stickyRevealOffset ?? 0;
  const thresholdCandidate = stickyH - revealOffset;
  const THRESHOLD = Math.max(
    topBarHeight,
    Math.min(THRESHOLD_BASE, thresholdCandidate),
  );
  const STICKY_ENTER = THRESHOLD + StickyLayout.stickyHysteresis;
  const STICKY_EXIT = THRESHOLD - StickyLayout.stickyHysteresis;

  // Debug: Log current state
  if (__DEV__ && false) {
    console.log('🔍 Sticky State:', {
      restHeaderHRef: restHeaderHRef.current,
      scrollHeaderH,
      actionBarHeight,
      THRESHOLD,
      showActionBarInHeader,
      showSticky,
      STICKY_ENTER,
      STICKY_EXIT,
    });
  }

  // No padding calculation needed - header is in normal flow above the list

  // Debug: Log measurements on mount and when they change
  useEffect(() => {
    if (__DEV__) {
      debugLog('📐 Sticky', {
        SAFE_TOP,
        searchHeight,
        GAP,
        actionBarHeight,
        stickyH,
        scrollHeaderH,
        THRESHOLD,
        showSticky,
      });
    }
  }, [
    SAFE_TOP,
    searchHeight,
    GAP,
    actionBarHeight,
    stickyH,
    scrollHeaderH,
    THRESHOLD,
    showSticky,
  ]);

  // Orientation change listener - force re-measure on dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      requestAnimationFrame(() => setScrollHeaderH(0)); // triggers fresh onLayout
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Only animate when screen is focused and not transitioning
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

  // Fallback: if no measurement happens within 1 second, use estimated height and LOCK it
  useEffect(() => {
    if (!isFocused) {
      return;
    } // Don't run timers when screen is not focused

    const timer = setTimeout(() => {
      if (restHeaderHRef.current === 0 && showActionBarInHeader) {
        const estimatedHeight =
          StickyLayout.categoryRailHeightDefault +
          StickyLayout.actionBarHeight + // Always include ActionBar in rest height
          StickyLayout.railActionGap; // Include the gap that scrolls with header
        console.log(
          '🔍 Timeout fallback - LOCKING estimated height:',
          estimatedHeight,
        );
        restHeaderHRef.current = estimatedHeight; // LOCK it
        setScrollHeaderH(estimatedHeight); // For debug
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [showActionBarInHeader, isFocused]);

  // Immediate fallback: if restHeaderH is still 0 after component mount, use estimated and LOCK it
  useEffect(() => {
    if (restHeaderHRef.current === 0) {
      const estimatedHeight =
        StickyLayout.categoryRailHeightDefault +
        StickyLayout.actionBarHeight + // Always include ActionBar in rest height
        StickyLayout.railActionGap; // Gap spacer matching header layout
      console.log(
        '🔍 Immediate fallback - LOCKING estimated height:',
        estimatedHeight,
      );
      restHeaderHRef.current = estimatedHeight; // LOCK it
      setScrollHeaderH(estimatedHeight); // For debug
    }
  }, []); // Run once on mount

  // Force measurement after a short delay if still 0
  useEffect(() => {
    const timer = setTimeout(() => {
      if (restHeaderHRef.current === 0) {
        const estimatedHeight =
          StickyLayout.categoryRailHeightDefault +
          StickyLayout.actionBarHeight +
          StickyLayout.railActionGap; // Gap spacer
        console.log(
          '🔍 Delayed fallback - LOCKING estimated height:',
          estimatedHeight,
        );
        restHeaderHRef.current = estimatedHeight; // LOCK it
        setScrollHeaderH(estimatedHeight); // For debug
      }
    }, 500); // Wait 500ms for layout to complete

    return () => clearTimeout(timer);
  }, []);

  // Measure scroll-away section height (Rail + ActionBar + Banner) - NOT including TopBar
  // CRITICAL: Only lock the measurement when ActionBar is in the header (rest state)
  // Measure TopBar height
  const handleTopBarLayout = useCallback((event: any) => {
    console.log(
      '🔍 TopBar onLayout called:',
      !!event,
      event?.nativeEvent?.layout,
    );
    const h = event?.nativeEvent?.layout?.height ?? 0;
    console.log('📏 TopBar measured height:', h);
    if (h > 0) {
      setSearchHeight(h);
      console.log('✅ TopBar height set to:', h);
    } else {
      console.log('⚠️ TopBar height is 0, ignoring');
    }
  }, []);

  // Measure ActionBar height
  const handleActionBarLayout = useCallback((event: any) => {
    console.log(
      '🔍 ActionBar onLayout called:',
      !!event,
      event?.nativeEvent?.layout,
    );
    const h = event?.nativeEvent?.layout?.height ?? 0;
    console.log('📏 ActionBar measured height:', h);
    if (h > 0) {
      setActionBarHeight(h);
      console.log('✅ ActionBar height set to:', h);
    } else {
      console.log('⚠️ ActionBar height is 0, ignoring');
    }
  }, []);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      console.log('🔄 Category changing from', activeCategory, 'to', category);

      // Use InteractionManager to defer state updates
      InteractionManager.runAfterInteractions(() => {
        setActiveCategory(category);

        // Reset measurement on category change to allow re-locking
        restHeaderHRef.current = 0;
        setScrollHeaderH(0);
        console.log('🔓 Unlocked header measurement for new category');

        // Auto-center the real header Rail on next frame
        if (headerRailRef.current) {
          requestAnimationFrame(() => {
            headerRailRef.current?.scrollToCategory(category);
          });
        }
      });
    },
    [activeCategory],
  );

  const handleActionPress = useCallback((action: string) => {
    // Handle job mode changes
    if (action.startsWith('jobMode:')) {
      const mode = action.split(':')[1] as 'seeking' | 'hiring';
      setJobMode(mode);
    }
  }, []);

  // Get appropriate add button text based on category
  const getAddButtonText = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      mikvah: 'Add Mikvah',
      eatery: 'Add Eatery',
      shul: 'Add Shul',
      stores: 'Add Store',
      jobs: 'Add Job',
      events: 'Add Event',
    };
    return categoryMap[category] || 'Add Entity';
  };

  const handleAddEntity = useCallback(() => {
    debugLog('Navigate to Add Entity for category:', activeCategory);

    if (activeCategory === 'mikvah') {
      navigation.navigate('AddMikvah');
    } else if (activeCategory === 'shul') {
      navigation.navigate('AddSynagogue');
    } else if (activeCategory === 'jobs') {
      navigation.navigate('CreateJobV2');
    } else if (activeCategory === 'events') {
      navigation.navigate('CreateEvent');
    } else {
      (navigation as any).navigate('AddCategory', { category: activeCategory });
    }
  }, [navigation, activeCategory]);

  // Handle location permission request
  const handleLocationPermissionRequest = useCallback(async () => {
    try {
      const granted = await requestLocationPermission();

      if (granted) {
        Alert.alert(
          'Location Enabled!',
          'You can now see distances to nearby businesses.',
          [{ text: 'Great!' }],
        );
      } else {
        Alert.alert(
          'Location Permission Denied',
          'To see distances to businesses, please enable location access in your device settings.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      errorLog('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Failed to request location permission. Please check your device settings.',
        [{ text: 'OK' }],
      );
    }
  }, [requestLocationPermission]);

  // Handle manual location refresh
  const handleLocationRefresh = useCallback(async () => {
    try {
      debugLog('🔥 Manual location refresh requested');
      const location = await getCurrentLocation();
      if (location) {
        debugLog('🔥 Manual location refresh successful:', location);
        Alert.alert(
          'Location Updated!',
          'Your location has been updated. You can now see distances to nearby businesses.',
          [{ text: 'Great!' }],
        );
      } else {
        debugLog('🔥 Manual location refresh failed - no location returned');
        Alert.alert(
          'Location Update Failed',
          'Unable to get your current location. Please check your device settings and try again.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      errorLog('Error refreshing location:', error);
      Alert.alert(
        'Error',
        'Failed to refresh location. Please check your device settings.',
        [{ text: 'OK' }],
      );
    }
  }, [getCurrentLocation]);

  // Swap logic with hysteresis
  // Scroll handler with proper threshold logic
  // Scroll handler with hysteresis - only update when focused
  const handleScroll = useCallback(
    (event: any) => {
      if (!isFocused || isTransitioning.current) {
        return;
      }

      const y = event.nativeEvent.contentOffset.y;
      setScrollY(y);
      setShowSticky(prev => (prev ? y >= STICKY_EXIT : y >= STICKY_ENTER));
    },
    [STICKY_ENTER, STICKY_EXIT, isFocused],
  );

  // Calculate responsive grid dimensions
  const gridColumns = getGridColumns();
  const gridDimensions = getGridCardDimensions(
    isTablet ? 48 : 32, // Total horizontal padding (both sides combined)
    isTablet ? 24 : 12, // Gap between cards
    4/3 // aspect ratio
  );
  
  // Debug logging
  if (__DEV__) {
    console.log('🔍 HomeScreen Grid Debug:', {
      screenWidth,
      isTablet,
      gridColumns,
      cardWidth: gridDimensions.cardWidth,
      imageHeight: gridDimensions.imageHeight,
    });
  }

  // Get grid render props from CategoryGridScreen hook
  const gridRenderProps = useCategoryGridRenderProps({
    categoryKey: activeCategory,
    query: searchQuery,
    jobMode: activeCategory === 'jobs' ? jobMode : undefined,
  });

  const handleScrollHeaderMeasured = useCallback(
    (event: any) => {
      if (!showActionBarInHeader) {
        return;
      }

      const height = event?.nativeEvent?.layout?.height ?? 0;
      if (height > 0) {
        restHeaderHRef.current = height;
        setScrollHeaderH(height);
      }
    },
    [showActionBarInHeader],
  );

  // ALL HOOKS MUST BE CALLED BEFORE CONDITIONAL RETURNS
  const renderListHeader = useCallback(() => {
    console.log('🔍 HomeScreen renderListHeader called:', {
      activeCategory,
      showSticky,
      showActionBarInHeader,
      scrollY,
      scrollHeaderH,
      restHeaderH: restHeaderHRef.current,
    });

    return (
      <GridListScrollHeader
        ref={headerRailRef}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        showActionBarInHeader={showActionBarInHeader} // ActionBar lives here until sticky hand-off
        onActionPress={handleActionPress}
        jobMode={jobMode}
        onMeasured={handleScrollHeaderMeasured}
        actionBarPlaceholderHeight={measuredActionBarHeight}
      />
    );
  }, [
    activeCategory,
    handleCategoryChange,
    showSticky,
    showActionBarInHeader,
    handleActionPress,
    jobMode,
    handleScrollHeaderMeasured,
    scrollHeaderH,
    scrollY,
    measuredActionBarHeight,
  ]);

  // Show skeleton loader on initial load
  const topBarPlaceholder =
    activeCategory === 'jobs' ? 'Find a job' : 'Search places, events...';

  if (activeCategory === 'jobs') {
    return <JobListingsScreen />;
  }

  if (gridRenderProps.isInitialLoading) {
    return (
      <View style={styles.container}>
        <TopBar
          onQueryChange={handleSearchChange}
          placeholder={topBarPlaceholder}
          onAddEntity={handleAddEntity}
          addButtonText={getAddButtonText(activeCategory)}
        />
        <View style={styles.container}>
          <SkeletonGrid count={6} columns={gridColumns} />
        </View>
      </View>
    );
  }

  // Show error if data load failed
  if (gridRenderProps.hasError) {
    return (
      <View style={styles.container}>
        <TopBar
          onQueryChange={handleSearchChange}
          placeholder={topBarPlaceholder}
          onAddEntity={handleAddEntity}
          addButtonText={getAddButtonText(activeCategory)}
        />
        <View style={styles.container}>{gridRenderProps.errorComponent}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FlatList: content padding creates space for fixed TopBar ONLY */}
      <FlatList
        key={`home-grid-${activeCategory}-${gridColumns}`} // Force remount on category or column change - CRITICAL
        data={gridRenderProps.data}
        renderItem={gridRenderProps.renderItem}
        keyExtractor={gridRenderProps.keyExtractor}
        numColumns={gridColumns}
        columnWrapperStyle={gridRenderProps.columnWrapperStyle}
        contentContainerStyle={[
          gridRenderProps.contentContainerStyle,
          {
            paddingTop: gridPaddingTop, // Offset grid for TopBar + gap, plus sticky inset when needed
          },
        ]}
        refreshControl={gridRenderProps.refreshControl as any}
        onEndReached={gridRenderProps.onEndReached}
        onEndReachedThreshold={0.5}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={gridRenderProps.ListFooterComponent}
        ListEmptyComponent={gridRenderProps.ListEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        // kill iOS automatic insets — we own the header
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollIndicatorInsets={{ top: 0, left: 0, right: 0, bottom: 0 }}
        accessibilityRole="list"
        accessibilityLabel={`${activeCategory} category items`}
      />

      {/* Layer 1: Fixed TopBar (absolutely positioned) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000, // Always on top
          // NO backgroundColor - let TopBar handle its own background
          // NO paddingTop - TopBar handles its own safe area insets
        }}
        onLayout={handleTopBarLayout}
      >
        <TopBar
          onQueryChange={handleSearchChange}
          placeholder="Search places, events..."
          onAddEntity={handleAddEntity}
          addButtonText={getAddButtonText(activeCategory)}
        />
      </View>

      {/* Layer 1.5: Background fill between TopBar and sticky ActionBar */}
      {showSticky && isFocused && !isTransitioning.current && (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: topBarHeight,
              overflow: 'hidden',
              zIndex: 998,
            }}
          >
            <BlurView
              style={StyleSheet.absoluteFillObject}
              blurType="light"
              blurAmount={16}
              reducedTransparencyFallbackColor={Colors.background.primary}
            />
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(255,255,255,0.35)',
              }}
            />
          </View>
          {GAP > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: topBarHeight,
                left: 0,
                right: 0,
                height: GAP,
                backgroundColor: Colors.background.primary,
                zIndex: 998,
              }}
            />
          )}

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: stickyLaneOffset,
              left: 0,
              right: 0,
              height:
                measuredActionBarHeight > 0
                  ? measuredActionBarHeight
                  : StickyLayout.actionBarHeight,
              overflow: 'hidden',
              zIndex: 998,
            }}
          >
            <BlurView
              style={StyleSheet.absoluteFillObject}
              blurType="light"
              blurAmount={12}
              reducedTransparencyFallbackColor={Colors.background.primary}
            />
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(255,255,255,0.4)',
              }}
            />
          </View>
        </>
      )}

      {/* Layer 2: Sticky ActionBar overlay - always render for measurement, show when sticky */}
      <View
        pointerEvents={showSticky && isFocused ? 'box-none' : 'none'} // Disable touch when not sticky or not focused
        accessible={showSticky && isFocused}
        importantForAccessibility={showSticky && isFocused ? 'yes' : 'no'}
        accessibilityElementsHidden={!showSticky || !isFocused}
        style={{
          position: 'absolute',
          top: stickyLaneOffset, // Align ActionBar directly under TopBar
          left: 0,
          right: 0,
          zIndex: 999, // Below TopBar (1000) but above FlatList
          backgroundColor: '#f8f8f8', // Solid background required for efficient shadow rendering
          opacity: showSticky && isFocused && !isTransitioning.current ? 1 : 0, // Hide when not sticky, not focused, or transitioning
          ...Platform.select({
            android: { elevation: 16 }, // stronger elevation ensures tap priority
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
          }),
        }}
        onLayout={handleActionBarLayout}
      >
        <ActionBar
          onActionPress={handleActionPress}
          currentCategory={activeCategory}
          jobMode={activeCategory === 'jobs' ? jobMode : undefined}
        />
      </View>

      {/* Debug overlay - positioned at bottom for full visibility */}
      {false && __DEV__ && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 8,
          }}
        >
          <StickyDebugOverlay
            SAFE_TOP={SAFE_TOP}
            SEARCH_H={topBarHeight}
            LANE_GAP={GAP}
            railHeight={StickyLayout.categoryRailHeightDefault}
            ACTION_H={measuredActionBarHeight}
            LANE_B_H={measuredActionBarHeight}
            STICKY_H={stickyH}
            THRESHOLD_Y={THRESHOLD}
            bannerHeight={StickyLayout.locationBannerHeightDefault}
            scrollY={scrollY}
            stickyHeightMeasured={scrollHeaderH}
            flatListPaddingTop={gridPaddingTop}
            paddingExtra={stickyGridInset}
            stickyOverlayHeight={stickyH}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});

export default HomeScreen;

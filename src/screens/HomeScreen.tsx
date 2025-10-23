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
import { useLocation } from '../hooks/useLocation';
import {
  getGridColumns,
  getGridCardDimensions,
  useResponsiveDimensions,
} from '../utils/deviceAdaptation';

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

  // Responsive category rail height for iPad
  const responsiveCategoryRailHeight = isTablet
    ? 116
    : StickyLayout.categoryRailHeightDefault;

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
        isTransitioning.current = false;
      });

      return () => {
        isTransitioning.current = true;
        task.cancel();
      };
    }, []),
  );

  // Live measurements - single source of truth (no more magic numbers!)
  const SAFE_TOP = insets.top;
  const [searchHeight, setSearchHeight] = useState(0);
  const [actionBarHeight, setActionBarHeight] = useState(0);
  const GAP = 4; // Small gap for visual breathing room

  // Use stable fallback values to prevent layout loops
  const topBarHeight = searchHeight > 0 ? searchHeight : 126; // Stable fallback
  const measuredActionBarHeight =
    actionBarHeight > 0 ? actionBarHeight : StickyLayout.actionBarHeight; // Stable fallback
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
      : responsiveCategoryRailHeight + StickyLayout.railActionGap;

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

  // No padding calculation needed - header is in normal flow above the list

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
          responsiveCategoryRailHeight +
          StickyLayout.actionBarHeight + // Always include ActionBar in rest height
          StickyLayout.railActionGap; // Include the gap that scrolls with header
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
        responsiveCategoryRailHeight +
        StickyLayout.actionBarHeight + // Always include ActionBar in rest height
        StickyLayout.railActionGap; // Gap spacer matching header layout
      restHeaderHRef.current = estimatedHeight; // LOCK it
      setScrollHeaderH(estimatedHeight); // For debug
    }
  }, []); // Run once on mount

  // Force measurement after a short delay if still 0
  useEffect(() => {
    const timer = setTimeout(() => {
      if (restHeaderHRef.current === 0) {
        const estimatedHeight =
          responsiveCategoryRailHeight +
          StickyLayout.actionBarHeight +
          StickyLayout.railActionGap; // Gap spacer
        restHeaderHRef.current = estimatedHeight; // LOCK it
        setScrollHeaderH(estimatedHeight); // For debug
      }
    }, 500); // Wait 500ms for layout to complete

    return () => clearTimeout(timer);
  }, []);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Measure scroll-away section height (Rail + ActionBar + Banner) - NOT including TopBar
  // CRITICAL: Only lock the measurement when ActionBar is in the header (rest state)
  // Measure TopBar height
  const handleTopBarLayout = useCallback(
    (event: any) => {
      const h = event?.nativeEvent?.layout?.height ?? 0;
      // Only update if height is reasonable and different from current
      if (h > 0 && h < 1000 && h !== searchHeight) {
        setSearchHeight(h);
      }
    },
    [searchHeight],
  );

  // Measure ActionBar height
  const handleActionBarLayout = useCallback(
    (event: any) => {
      const h = event?.nativeEvent?.layout?.height ?? 0;
      // Only update if height is reasonable and different from current
      if (h > 0 && h < 1000 && h !== actionBarHeight) {
        setActionBarHeight(h);
      }
    },
    [actionBarHeight],
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      // Use InteractionManager to defer state updates
      InteractionManager.runAfterInteractions(() => {
        setActiveCategory(category);

        // Reset measurement on category change to allow re-locking
        restHeaderHRef.current = 0;
        setScrollHeaderH(0);

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
      const location = await getCurrentLocation();
      if (location) {
        Alert.alert(
          'Location Updated!',
          'Your location has been updated. You can now see distances to nearby businesses.',
          [{ text: 'Great!' }],
        );
      } else {
        Alert.alert(
          'Location Update Failed',
          'Unable to get your current location. Please check your device settings and try again.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to refresh location. Please check your device settings.',
        [{ text: 'OK' }],
      );
    }
  }, [getCurrentLocation]);

  // Swap logic with hysteresis
  // Scroll handler with proper threshold logic
  // Smart scroll handler - only snap when user stops scrolling
  const scrollViewRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef(false);

  const handleScroll = useCallback(
    (event: any) => {
      if (!isFocused || isTransitioning.current) {
        return;
      }

      const y = event.nativeEvent.contentOffset.y;
      setScrollY(y);

      // Mark that user is actively scrolling
      isUserScrollingRef.current = true;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set a timeout to detect when user stops scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;

        // Only snap if user has stopped scrolling and we're near the threshold
        const snapZone = 30; // Larger zone for better UX
        const isInSnapZone = Math.abs(y - THRESHOLD) < snapZone;

        if (isInSnapZone) {
          // Smooth snap to threshold
          scrollViewRef.current?.scrollToOffset({
            offset: THRESHOLD,
            animated: true,
          });
        }
      }, 150); // Wait 150ms after user stops scrolling

      // Update sticky state based on threshold
      setShowSticky(y >= THRESHOLD);
    },
    [THRESHOLD, isFocused],
  );

  // Calculate responsive grid dimensions
  const gridColumns = getGridColumns();
  const gridDimensions = getGridCardDimensions(
    isTablet ? 32 : 32, // iPad: 16px each side for breathing room, Phone: 16px each side = 32px total
    isTablet ? 16 : 12, // Gap between cards - increased for iPad with 4 larger cards
    4 / 3, // aspect ratio
  );

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
        ref={scrollViewRef}
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

      {/* Layer 0.5: Extended background blur layer - blends with grid content */}
      {showSticky && isFocused && !isTransitioning.current && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height:
              topBarHeight +
              GAP +
              measuredActionBarHeight +
              StickyLayout.overlayFadeHeight, // Cover sticky header plus fade below ActionBar
            zIndex: 995, // Behind TopBar and ActionBar but above content
            overflow: 'hidden',
          }}
        >
          <BlurView
            style={StyleSheet.absoluteFillObject}
            blurType="light"
            blurAmount={20}
            reducedTransparencyFallbackColor={Colors.background.primary}
          />
          {/* Gradient overlay for seamless blend with grid */}
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(255,255,255,0.15)', // Slightly stronger at top
            }}
          />
          {/* Progressive fade below ActionBar */}
          <View
            style={{
              position: 'absolute',
              top: topBarHeight + GAP + measuredActionBarHeight,
              left: 0,
              right: 0,
              height: StickyLayout.overlayFadeHeight,
              backgroundColor: 'rgba(255,255,255,0.1)',
              opacity: 0.8,
            }}
          />
        </View>
      )}

      {/* Layer 1: Fixed TopBar (absolutely positioned) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000, // Always on top
          backgroundColor: 'transparent', // Transparent to show background blur
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

      {/* Layer 2: Sticky ActionBar - positioned with gap under TopBar */}
      <View
        style={{
          position: 'absolute',
          top: topBarHeight + GAP, // Start with 4px gap under TopBar
          left: 0,
          right: 0,
          zIndex: 999, // Below TopBar but above content
          paddingHorizontal: 6,
          backgroundColor: 'transparent', // Transparent to show background blur
          opacity: showSticky && isFocused && !isTransitioning.current ? 1 : 0, // Hide when not sticky
        }}
        pointerEvents={
          showSticky && isFocused && !isTransitioning.current ? 'auto' : 'none'
        } // Disable touch when hidden
      >
        <ActionBar
          onActionPress={handleActionPress}
          currentCategory={activeCategory}
          jobMode={activeCategory === 'jobs' ? jobMode : undefined}
        />
      </View>

      {/* Old background fill layers removed - single blur layer handles everything */}

      {/* Old separate ActionBar container removed - now integrated into unified container */}

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
            railHeight={responsiveCategoryRailHeight}
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

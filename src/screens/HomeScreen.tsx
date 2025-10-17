import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { View, FlatList, StyleSheet, Dimensions, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import StickyStack from '../components/StickyStack';
import GridListHeader, {
  GridListHeaderRef,
} from '../components/GridListHeader';
import { useCategoryGridRenderProps } from './CategoryGridScreen';
import EnhancedJobsScreen from './EnhancedJobsScreen';
import { SkeletonGrid } from '../components/SkeletonLoader';
import type { AppStackParamList } from '../types/navigation';
import { Colors, StickyLayout } from '../styles/designSystem';
import { debugLog, errorLog } from '../utils/logger';
import { useLocation } from '../hooks/useLocation';

interface HomeScreenProps {
  onSearchChange?: (query: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSearchChange }) => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const headerRailRef = useRef<GridListHeaderRef>(null);

  // Core state
  const [activeCategory, setActiveCategory] = useState('mikvah');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobMode, setJobMode] = useState<'seeking' | 'hiring'>('hiring');

  // Measurement state with conservative fallbacks
  const [railHeight, setRailHeight] = useState(
    StickyLayout.categoryRailHeightDefault,
  );
  const [bannerHeight, setBannerHeight] = useState(
    StickyLayout.locationBannerHeightDefault,
  );
  const [measurementComplete, setMeasurementComplete] = useState(false);

  // Scroll state
  const [showActionBar, setShowActionBar] = useState(false);

  // Layout dirty flag for orientation/RTL changes
  const [layoutDirty, setLayoutDirty] = useState(false);

  // Location hooks
  const {
    location,
    requestLocationPermission,
    permissionGranted,
    getCurrentLocation,
    loading: locationLoading,
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

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayoutDirty(true);
      setMeasurementComplete(false);
    });
    return () => subscription?.remove();
  }, []);

  // Calculate sticky constants
  const SAFE_TOP = insets.top;
  const SEARCH_H = StickyLayout.searchBarHeight;
  const LANE_GAP = StickyLayout.laneGap;
  const ACTION_H = StickyLayout.actionBarHeight;
  const LANE_B_H = Math.max(railHeight, ACTION_H); // Lock to max height
  const BUFFER = StickyLayout.scrollBuffer;

  const STICKY_H = SAFE_TOP + SEARCH_H + LANE_GAP + LANE_B_H;
  const THRESHOLD_Y = railHeight + bannerHeight;

  // One-shot measurement handlers
  const handleRailLayout = useCallback(
    (height: number) => {
      if (!measurementComplete) {
        debugLog('📏 Rail height measured:', height);
        setRailHeight(height);
      }
    },
    [measurementComplete],
  );

  const handleBannerLayout = useCallback(
    (height: number) => {
      if (!measurementComplete) {
        debugLog('📏 Banner height measured:', height);
        setBannerHeight(height);
        setMeasurementComplete(true); // Mark complete after both measurements
      }
    },
    [measurementComplete],
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange],
  );

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);

    // Auto-center the real header Rail on next frame
    if (headerRailRef.current) {
      requestAnimationFrame(() => {
        headerRailRef.current?.scrollToCategory(category);
      });
    }
  }, []);

  const handleActionPress = useCallback((action: string) => {
    // Handle job mode changes
    if (action.startsWith('jobMode:')) {
      const mode = action.split(':')[1] as 'seeking' | 'hiring';
      setJobMode(mode);
    }
  }, []);

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
          `Your location has been updated. You can now see distances to nearby businesses.`,
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
  const handleScroll = useCallback(
    (event: any) => {
      const y = event.nativeEvent.contentOffset.y;

      // Apply hysteresis buffer to prevent flicker
      if (!showActionBar && y >= THRESHOLD_Y + BUFFER) {
        debugLog('🔄 Swap to ActionBar at y:', y);
        setShowActionBar(true);
      } else if (showActionBar && y < THRESHOLD_Y - BUFFER) {
        debugLog('🔄 Swap to Rail at y:', y);
        setShowActionBar(false);
      }
    },
    [showActionBar, THRESHOLD_Y, BUFFER],
  );

  // Get grid render props from CategoryGridScreen hook
  const gridRenderProps = useCategoryGridRenderProps({
    categoryKey: activeCategory,
    query: searchQuery,
    jobMode: activeCategory === 'jobs' ? jobMode : undefined,
  });

  // Render GridListHeader as the FlatList header
  const renderListHeader = useCallback(() => {
    return (
      <GridListHeader
        ref={headerRailRef}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        onRailLayout={handleRailLayout}
        onBannerLayout={handleBannerLayout}
        onLocationPermissionRequest={handleLocationPermissionRequest}
        onLocationRefresh={handleLocationRefresh}
        locationLoading={locationLoading}
      />
    );
  }, [
    activeCategory,
    handleCategoryChange,
    handleRailLayout,
    handleBannerLayout,
    handleLocationPermissionRequest,
    handleLocationRefresh,
    locationLoading,
  ]);

  // Show skeleton loader on initial load
  if (gridRenderProps.isInitialLoading) {
    return (
      <View style={styles.container}>
        <StickyStack
          showActionBar={showActionBar}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onAddEntity={handleAddEntity}
          onActionPress={handleActionPress}
          jobMode={jobMode}
          LANE_B_H={LANE_B_H}
        />
        <View style={[styles.container, { paddingTop: STICKY_H }]}>
          <SkeletonGrid count={6} columns={2} />
        </View>
      </View>
    );
  }

  // Show error if data load failed
  if (gridRenderProps.hasError) {
    return (
      <View style={styles.container}>
        <StickyStack
          showActionBar={showActionBar}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onAddEntity={handleAddEntity}
          onActionPress={handleActionPress}
          jobMode={jobMode}
          LANE_B_H={LANE_B_H}
        />
        <View style={[styles.container, { paddingTop: STICKY_H }]}>
          {gridRenderProps.errorComponent}
        </View>
      </View>
    );
  }

  // Special handling for jobs category (use EnhancedJobsScreen for now)
  if (activeCategory === 'jobs') {
    return (
      <View style={styles.container}>
        <StickyStack
          showActionBar={showActionBar}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onAddEntity={handleAddEntity}
          onActionPress={handleActionPress}
          jobMode={jobMode}
          LANE_B_H={LANE_B_H}
        />
        <EnhancedJobsScreen />
      </View>
    );
  }

  // Main render with sticky stack and FlatList
  return (
    <View style={styles.container}>
      {/* Sticky overlay */}
      <StickyStack
        showActionBar={showActionBar}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onAddEntity={handleAddEntity}
        onActionPress={handleActionPress}
        jobMode={jobMode}
        LANE_B_H={LANE_B_H}
      />

      {/* FlatList with grid - owned by HomeScreen */}
      <FlatList
        key="home-grid-list"
        data={gridRenderProps.data}
        renderItem={gridRenderProps.renderItem}
        keyExtractor={gridRenderProps.keyExtractor}
        numColumns={2}
        columnWrapperStyle={gridRenderProps.columnWrapperStyle}
        contentContainerStyle={[
          gridRenderProps.contentContainerStyle,
          { paddingTop: STICKY_H }, // Critical: pad for sticky stack
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
        accessibilityRole="list"
        accessibilityLabel={`${activeCategory} category items`}
      />
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

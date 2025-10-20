import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, StyleSheet } from 'react-native';
import CategoryRail from './CategoryRail';
import ActionBar from './ActionBar';
import TopBar from './TopBar';
import FastButton from './FastButton';
import { Colors, Spacing, BorderRadius } from '../styles/designSystem';
import { View as RNView, Text } from 'react-native';
import { useLocation } from '../hooks/useLocation';

export interface GridListHeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onRailLayout?: (height: number) => void;
  onBannerLayout?: (height: number) => void;
  onLocationPermissionRequest?: () => void;
  onLocationRefresh?: () => void;
  locationLoading?: boolean;
  showActionBarInHeader?: boolean; // Clear intent: under rail at rest
  onActionPress?: (action: string) => void;
  jobMode?: 'seeking' | 'hiring';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddEntity: () => void;
  getAddButtonText: (category: string) => string;
  SAFE_TOP: number;
}

export interface GridListHeaderRef {
  scrollToCategory: (category: string) => void;
}

const GridListHeader = forwardRef<GridListHeaderRef, GridListHeaderProps>(
  (
    {
      activeCategory,
      onCategoryChange,
      onRailLayout,
      onBannerLayout,
      onLocationPermissionRequest,
      onLocationRefresh,
      locationLoading = false,
      showActionBarInHeader = false,
      onActionPress,
      jobMode,
      searchQuery,
      onSearchChange,
      onAddEntity,
      getAddButtonText,
      SAFE_TOP,
    },
    ref,
  ) => {
    const railRef = React.useRef<any>(null);
    const { location, permissionGranted } = useLocation();

    // Expose scrollToCategory method to parent
    useImperativeHandle(ref, () => ({
      scrollToCategory: (category: string) => {
        // CategoryRail will handle auto-scrolling internally
        // This is a placeholder for future enhancements if needed
      },
    }));

    // Measurement for CategoryRail
    const handleRailLayout = useCallback(
      (event: any) => {
        const { height } = event.nativeEvent.layout;
        onRailLayout?.(height);
      },
      [onRailLayout],
    );

    // Measurement for LocationBanner
    const handleBannerLayout = useCallback(
      (event: any) => {
        if (event && event.nativeEvent && event.nativeEvent.layout) {
          const { height } = event.nativeEvent.layout;
          onBannerLayout?.(height);
        }
      },
      [onBannerLayout],
    );

    // Determine which banner to show
    const shouldShowPermissionBanner = !location && !permissionGranted;
    const shouldShowRefreshBanner = !location && permissionGranted;
    const shouldShowBanner =
      shouldShowPermissionBanner || shouldShowRefreshBanner;

    return (
      <View style={styles.container}>
        {/* TopBar */}
        <TopBar
          onQueryChange={onSearchChange}
          placeholder={
            activeCategory === 'jobs'
              ? 'Find a job'
              : 'Search places, events...'
          }
          onAddEntity={onAddEntity}
          addButtonText={getAddButtonText(activeCategory)}
        />

        {/* CategoryRail with measurement */}
        <View
          onLayout={event => {
            if (event && event.nativeEvent && event.nativeEvent.layout) {
              const h = event.nativeEvent.layout.height;
              onRailLayout?.(h);
            }
          }}
        >
          <CategoryRail
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
            compact={false}
          />
        </View>

        {/* ActionBar - only when not sticky */}
        {showActionBarInHeader && (
          <View
            accessible
            importantForAccessibility="yes"
            accessibilityElementsHidden={false}
          >
            <ActionBar
              onActionPress={onActionPress}
              currentCategory={activeCategory}
              jobMode={jobMode}
            />
          </View>
        )}

        {/* Debug logging */}
        {__DEV__ &&
          (() => {
            console.log('🔍 GridListHeader render:', {
              showActionBarInHeader,
              activeCategory,
              onActionPress: !!onActionPress,
              jobMode,
            });
            return null;
          })()}

        {/* LocationBanner with measurement */}
        {shouldShowBanner && (
          <View onLayout={handleBannerLayout} style={styles.locationBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>
                {shouldShowPermissionBanner ? '📍' : '🔄'}
              </Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>
                  {shouldShowPermissionBanner
                    ? 'Enable Location'
                    : 'Refresh Location'}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  {shouldShowPermissionBanner
                    ? 'See distances to nearby businesses'
                    : 'Tap to get your current location'}
                </Text>
              </View>
              <FastButton
                title={
                  shouldShowPermissionBanner
                    ? 'Enable'
                    : locationLoading
                    ? 'Getting...'
                    : 'Refresh'
                }
                onPress={
                  shouldShowPermissionBanner && onLocationPermissionRequest
                    ? onLocationPermissionRequest
                    : onLocationRefresh
                    ? onLocationRefresh
                    : () => {}
                }
                variant="outline"
                size="small"
                disabled={locationLoading}
                loading={locationLoading}
                style={styles.bannerButtonStyle}
                textStyle={styles.bannerButtonText}
              />
            </View>
          </View>
        )}
      </View>
    );
  },
);

GridListHeader.displayName = 'GridListHeader';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
  },
  locationBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  bannerIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
    color: '#71BBFF',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 0,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#000000',
    opacity: 0.6,
  },
  bannerButtonStyle: {
    backgroundColor: '#71BBFF',
    minHeight: 28,
    paddingHorizontal: 12,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GridListHeader;

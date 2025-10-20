import React, { forwardRef, useCallback, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CategoryRail from './CategoryRail';
import ActionBar from './ActionBar';
import FastButton from './FastButton';
import {
  Colors,
  StickyLayout,
  Spacing,
  BorderRadius,
  Typography,
} from '../styles/designSystem';
import { useLocation } from '../hooks/useLocation';
import { debugLog, errorLog } from '../utils/logger';

export interface GridListScrollHeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  showActionBarInHeader?: boolean; // Clear intent: under rail at rest
  onActionPress?: (action: string) => void;
  jobMode?: 'seeking' | 'hiring';
  onMeasured?: (event: any) => void; // Measurement callback
  actionBarPlaceholderHeight?: number;
}

export interface GridListScrollHeaderRef {
  scrollToCategory: (category: string) => void;
}

const GridListScrollHeader = forwardRef<
  GridListScrollHeaderRef,
  GridListScrollHeaderProps
>(
  (
    {
      activeCategory,
      onCategoryChange,
      showActionBarInHeader = false,
      onActionPress,
      jobMode,
      onMeasured,
      actionBarPlaceholderHeight = StickyLayout.actionBarHeight,
    },
    ref,
  ) => {
    // Expose scrollToCategory method to parent
    useImperativeHandle(ref, () => ({
      scrollToCategory: (_category: string) => {
        // CategoryRail will handle auto-scrolling internally
        // This is a placeholder for future enhancements if needed
      },
    }));

    const {
      location,
      loading: locationLoading,
      permissionGranted,
      requestLocationPermission,
      getCurrentLocation,
      error: locationError,
    } = useLocation();

    const shouldShowPermissionBanner = !location && !permissionGranted;
    const shouldShowRefreshBanner = !location && permissionGranted;
    const shouldShowBanner =
      shouldShowPermissionBanner || shouldShowRefreshBanner;

    const handleEnableLocation = useCallback(async () => {
      try {
        debugLog('📍 Location banner enable pressed');
        await requestLocationPermission();
      } catch (err) {
        errorLog('Location permission request failed:', err);
      }
    }, [requestLocationPermission]);

    const handleRefreshLocation = useCallback(async () => {
      try {
        debugLog('🔄 Location banner refresh pressed');
        await getCurrentLocation();
      } catch (err) {
        errorLog('Location refresh failed:', err);
      }
    }, [getCurrentLocation]);

    const bannerButtonTitle = shouldShowPermissionBanner
      ? 'Enable'
      : locationLoading
      ? 'Getting...'
      : 'Refresh';

    const bannerSubtitle = shouldShowPermissionBanner
      ? 'See distances to nearby businesses'
      : 'Tap to get your current location';

    console.log('📋 GridListScrollHeader rendering:', {
      activeCategory,
      showActionBarInHeader,
      hasOnMeasured: !!onMeasured,
    });

    return (
      <View
        style={styles.container}
        onLayout={e => {
          console.log('🔍 GridListScrollHeader onLayout called:', {
            hasEvent: !!e,
            hasNativeEvent: !!(e && e.nativeEvent),
            hasLayout: !!(e && e.nativeEvent && e.nativeEvent.layout),
            hasOnMeasured: !!onMeasured,
            activeCategory,
            showActionBarInHeader,
          });

          if (e && e.nativeEvent && e.nativeEvent.layout && onMeasured) {
            const height = e.nativeEvent.layout.height;
            console.log('📏 GridListScrollHeader measured:', {
              height,
              activeCategory,
              showActionBarInHeader,
            });
            // Call onMeasured with the full event object, not just the height
            onMeasured(e);
          } else {
            console.log('⚠️ GridListScrollHeader onLayout conditions not met');
          }
        }}
      >
        {/* CategoryRail */}
        <CategoryRail
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          compact={false}
        />

        {/* ActionBar - only when not sticky */}
        {showActionBarInHeader && (
          <View style={styles.actionBarWrapper}>
            <ActionBar
              onActionPress={onActionPress}
              currentCategory={activeCategory}
              jobMode={jobMode}
            />
          </View>
        )}

        {!showActionBarInHeader && (
          <View
            style={[
              styles.actionBarPlaceholder,
              { height: actionBarPlaceholderHeight },
            ]}
          />
        )}

        {shouldShowBanner && (
          <View style={styles.locationBanner}>
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
                <Text style={styles.bannerSubtitle}>{bannerSubtitle}</Text>
              </View>
              <FastButton
                title={bannerButtonTitle}
                onPress={
                  shouldShowPermissionBanner
                    ? handleEnableLocation
                    : handleRefreshLocation
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

        {locationError && !shouldShowBanner && (
          <View style={[styles.locationBanner, styles.locationBannerError]}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>⚠️</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Location Error</Text>
                <Text style={styles.bannerSubtitle}>{locationError}</Text>
              </View>
              <FastButton
                title="Retry"
                onPress={handleRefreshLocation}
                variant="outline"
                size="small"
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

GridListScrollHeader.displayName = 'GridListScrollHeader';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    paddingTop: StickyLayout.laneGap,
  },
  locationBanner: {
    marginTop: 0,
    marginHorizontal: Spacing.md,
    marginBottom: StickyLayout.railActionGap,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.06)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  locationBannerError: {
    backgroundColor: Colors.error,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 32,
  },
  bannerIcon: {
    fontSize: 16,
    color: '#3B82F6',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.styles.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  bannerSubtitle: {
    ...Typography.styles.caption,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  bannerButtonStyle: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderColor: 'transparent',
  },
  bannerButtonText: {
    ...Typography.styles.body,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  actionBarWrapper: {
    marginBottom: StickyLayout.railActionGap,
  },
  actionBarPlaceholder: {
    marginTop: 0,
    marginBottom: StickyLayout.railActionGap,
  },
});

export default GridListScrollHeader;

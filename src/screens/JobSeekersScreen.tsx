import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { DistanceDisplay } from '../components/DistanceDisplay';
import ActionBar from '../components/ActionBar';
import Icon from '../components/Icon';
import { debugLog, errorLog } from '../utils/logger';
import jobSeekersService, {
  JobSeeker,
  JobSeekersSearchParams,
} from '../services/JobSeekersService';

// JobSeeker interface is now imported from JobSeekersService

const JobSeekersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { location } = useLocation();
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load job seekers from API

  useEffect(() => {
    debugLog('🔍 JobSeekersScreen: Component mounted, loading job seekers...');
    try {
      loadJobSeekers();
    } catch (err) {
      errorLog('❌ JobSeekersScreen: Error in useEffect:', err);
      setError('Failed to initialize job seekers');
    }
  }, []);

  const loadJobSeekers = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }

      debugLog('🔍 Loading job seekers - page:', page, 'append:', append);

      const params: JobSeekersSearchParams = {
        page,
        limit: pagination.limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      debugLog('🔍 Job seekers params:', params);

      const response = await jobSeekersService.getJobSeekers(params);

      debugLog('🔍 Job seekers response:', response);

      if (response.success && response.data) {
        const newJobSeekers = response.data.job_seekers;

        debugLog('🔍 Got job seekers:', newJobSeekers.length, 'items');

        if (append) {
          setJobSeekers(prev => [...prev, ...newJobSeekers]);
        } else {
          setJobSeekers(newJobSeekers);
        }

        setPagination(response.data.pagination);
        setHasMore(page < response.data.pagination.pages);

        debugLog('🔍 Updated pagination:', response.data.pagination);
      } else {
        errorLog('❌ Failed to load job seekers:', response.error);
        if (!append) {
          setJobSeekers([]);
          setError(response.error || 'Failed to load job seekers');
        }
      }
    } catch (error) {
      errorLog('❌ Error loading job seekers:', error);
      if (!append) {
        setJobSeekers([]);
        setError(
          error instanceof Error ? error.message : 'Failed to load job seekers',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadJobSeekers(1, false);
    } catch (err) {
      errorLog('❌ JobSeekersScreen: Error in refresh:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleHeartPress = useCallback(
    async (jobSeekerId: string) => {
      try {
        const newFavorites = new Set(favorites);
        if (favorites.has(jobSeekerId)) {
          newFavorites.delete(jobSeekerId);
        } else {
          newFavorites.add(jobSeekerId);
        }
        setFavorites(newFavorites);

        // Update the job seeker's favorite status
        setJobSeekers(prev =>
          prev.map(seeker =>
            seeker.id === jobSeekerId
              ? { ...seeker, is_favorited: !seeker.is_favorited }
              : seeker,
          ),
        );
      } catch (error) {
        errorLog('Error toggling favorite:', error);
      }
    },
    [favorites],
  );

  const handleCardPress = useCallback(
    (jobSeeker: JobSeeker) => {
      debugLog(
        '🔍 JobSeekersScreen: Job seeker selected:',
        jobSeeker.full_name,
        'ID:',
        jobSeeker.id,
      );
      try {
        // Navigate to job seeker detail screen
        (navigation as any).navigate('JobSeekerDetailV2', {
          profileId: jobSeeker.id,
        });
        debugLog('🔍 JobSeekersScreen: Navigation triggered successfully');
      } catch (error) {
        errorLog('❌ JobSeekersScreen: Navigation error:', error);
      }
    },
    [navigation],
  );

  const renderJobSeekerCard = useCallback(
    ({ item }: { item: JobSeeker }) => {
      const isFavorited = favorites.has(item.id) || item.is_favorited;

      // Calculate real distance if user location is available (in meters)
      let realDistanceMeters: number | null = null;
      // Note: JobSeeker doesn't have latitude/longitude, so we'll skip distance calculation
      // if (location && item.latitude && item.longitude) {
      //   const distanceMiles = calculateDistance(
      //     location.latitude,
      //     location.longitude,
      //     Number(item.latitude),
      //     Number(item.longitude)
      //   );
      //
      //   // Convert miles to meters
      //   const distanceMeters = distanceMiles * 1609.34;
      //
      //   // For testing: allow larger distances since iOS simulator gives SF location
      //   if (distanceMeters <= 16093400) { // 10,000 miles in meters
      //     realDistanceMeters = distanceMeters;
      //   }
      // } else if (location && item.city && item.state) {
      //   // Fallback: show location text if no coordinates
      //   realDistanceMeters = null;
      // }

      const handlePress = () => handleCardPress(item);
      const handleHeartPressLocal = () => handleHeartPress(item.id);

      return (
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={handlePress}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${item.full_name}, ${item.title}`}
          accessibilityHint="Tap to view candidate details"
        >
          {/* Heart button on top right */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={handleHeartPressLocal}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorited ? 'Remove from favorites' : 'Add to favorites'
            }
            accessibilityHint="Tap to toggle favorite status"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="heart"
              size={18}
              color={isFavorited ? Colors.error : Colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            {/* Name - Biggest element, 1 line, truncated */}
            <Text style={styles.nameText} numberOfLines={1}>
              {item.full_name}
            </Text>

            {/* Job Title - Below name */}
            <Text style={styles.titleText} numberOfLines={1}>
              {item.title}
            </Text>

            {/* Experience - In a blue pill */}
            <View style={styles.experienceContainer}>
              <Text style={styles.experienceText}>{item.experience}</Text>
            </View>

            {/* Distance/Zip Code - Bottom right, underlined */}
            <View style={styles.bottomRightContainer}>
              {realDistanceMeters ? (
                <DistanceDisplay
                  distanceMeters={realDistanceMeters}
                  accuracyContext={{
                    accuracyAuthorization: 'full',
                    isApproximate: false,
                  }}
                  textStyle={styles.bottomRightText}
                  options={{ unit: 'imperial' }}
                />
              ) : (
                <Text style={styles.bottomRightText}>
                  {item.zip_code ? String(item.zip_code) : 'N/A'}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [favorites, location, handleCardPress, handleHeartPress],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Job Seekers Found</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for new candidates or try adjusting your filters.
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>⚠️ Error Loading Job Seekers</Text>
      <Text style={styles.emptySubtitle}>
        {error || 'An unexpected error occurred. Please try again.'}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setError(null);
          loadJobSeekers(1, false);
        }}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
      </View>
    );
  };

  const keyExtractor = useCallback((item: JobSeeker) => item.id, []);

  const getItemLayout = useCallback(
    (data: JobSeeker[] | null | undefined, index: number) => ({
      length: 280,
      offset: 280 * index,
      index,
    }),
    [],
  );

  if (loading && jobSeekers.length === 0) {
    debugLog('🔍 JobSeekersScreen: Showing loading state');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading job seekers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  debugLog(
    '🔍 JobSeekersScreen: Rendering main view with',
    jobSeekers.length,
    'job seekers',
  );

  return (
    <SafeAreaView style={styles.container}>
      <ActionBar
        currentCategory="jobs"
        jobMode="seeking"
        onActionPress={action => {
          if (action === 'addCategory') {
            // Navigate to resume posting form
            (navigation as any).navigate('JobSeeking');
          }
        }}
      />
      <FlatList
        data={jobSeekers}
        renderItem={renderJobSeekerCard}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
          />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            loadJobSeekers(pagination.page + 1, true);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={error ? renderError : renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel="Job seekers list"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    height: 280,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    position: 'relative',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    backgroundColor: Colors.white,
    borderRadius: TouchTargets.minimum / 2,
    padding: Spacing.xs,
    ...Shadows.xs,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
  },
  nameText: {
    ...Typography.styles.h3,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  titleText: {
    ...Typography.styles.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  experienceContainer: {
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  experienceText: {
    ...Typography.styles.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  bottomRightContainer: {
    alignSelf: 'flex-end',
  },
  bottomRightText: {
    ...Typography.styles.caption,
    fontSize: 10,
    color: Colors.primary.main,
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    textAlign: 'center',
  },
});

export default JobSeekersScreen;

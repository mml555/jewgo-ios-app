import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  LayoutAnimation,
  UIManager,
  InteractionManager,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from '@react-native-community/blur';
import JobCard from '../../components/JobCard';
import { CategoryItem } from '../../hooks/useCategoryData';
import TopBar from '../../components/TopBar';
import ActionBar from '../../components/ActionBar';
import GridListScrollHeader, {
  GridListScrollHeaderRef,
} from '../../components/GridListScrollHeader';
import JobsService, {
  JobListing,
  Industry,
  JobType,
} from '../../services/JobsService';
import jobSeekersService, { JobSeeker } from '../../services/JobSeekersService';
import { Spacing, Colors, StickyLayout } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';
import {
  FALLBACK_INDUSTRIES,
  FALLBACK_JOB_TYPES,
} from '../../utils/fallbackData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { debugLog } from '../../utils/logger';
import Icon from '../../components/Icon';
import FiltersModal from '../../components/FiltersModal';
import { useFilters } from '../../hooks/useFilters';

type JobListingsScreenNavigationProp = StackNavigationProp<AppStackParamList>;

const JobListingsScreen: React.FC = () => {
  const navigation = useNavigation<JobListingsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerRailRef = useRef<GridListScrollHeaderRef>(null);
  const isFocused = useIsFocused();
  const isTransitioning = useRef(false);

  const [jobMode, setJobMode] = useState<'hiring' | 'seeking'>('hiring');
  const activeCategory = 'jobs';

  // Scroll-away section height (Rail + ActionBar) - NOT including TopBar
  const restHeaderHRef = useRef(0); // LOCKED resting header height
  const [scrollHeaderH, setScrollHeaderH] = useState(0); // For measurements

  // Scroll state
  const [scrollY, setScrollY] = useState(0);
  const [showSticky, setShowSticky] = useState(false);

  // Clear intent: ActionBar placement
  const showActionBarInHeader = !showSticky;

  // Live measurements
  const SAFE_TOP = insets.top;
  const [searchHeight, setSearchHeight] = useState(0);
  const [actionBarHeight, setActionBarHeight] = useState(0);
  const GAP = StickyLayout.laneGap;

  // Calculate heights
  const topBarHeight =
    searchHeight > 0 ? searchHeight : SAFE_TOP + StickyLayout.searchBarHeight;
  const measuredActionBarHeight =
    actionBarHeight > 0 ? actionBarHeight : StickyLayout.actionBarHeight;
  const stickyLaneOffset = topBarHeight + GAP;
  const stickyH = stickyLaneOffset + measuredActionBarHeight;

  // FlatList padding equals the area permanently occupied by TopBar + gap (match HomeScreen)
  const listPaddingTop = stickyLaneOffset;
  const stickyGridInset = showSticky ? StickyLayout.overlayGridInset : 0;
  const gridPaddingTop = listPaddingTop + stickyGridInset;

  // Threshold calculations
  const headerPreActionHeight =
    scrollHeaderH > 0
      ? Math.max(0, scrollHeaderH - measuredActionBarHeight)
      : StickyLayout.categoryRailHeightDefault + StickyLayout.railActionGap;

  const THRESHOLD_BASE = topBarHeight + headerPreActionHeight;
  const revealOffset = StickyLayout.stickyRevealOffset ?? 0;
  const thresholdCandidate = stickyH - revealOffset;
  const THRESHOLD = Math.max(
    topBarHeight,
    Math.min(THRESHOLD_BASE, thresholdCandidate),
  );
  const STICKY_ENTER = THRESHOLD + StickyLayout.stickyHysteresis;
  const STICKY_EXIT = THRESHOLD - StickyLayout.stickyHysteresis;

  // Enable layout animations
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

  // Fallback: if no measurement happens within 1 second, use estimated height
  useEffect(() => {
    if (!isFocused) {
      return;
    } // Don't run timers when screen is not focused

    const timer = setTimeout(() => {
      if (restHeaderHRef.current === 0 && showActionBarInHeader) {
        const estimatedHeight =
          StickyLayout.categoryRailHeightDefault +
          StickyLayout.actionBarHeight +
          StickyLayout.railActionGap;
        debugLog(
          '🔍 Timeout fallback - LOCKING estimated height:',
          estimatedHeight,
        );
        restHeaderHRef.current = estimatedHeight;
        setScrollHeaderH(estimatedHeight);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [showActionBarInHeader, isFocused]);

  // Immediate fallback: use estimated height on mount
  useEffect(() => {
    if (restHeaderHRef.current === 0) {
      const estimatedHeight =
        StickyLayout.categoryRailHeightDefault +
        StickyLayout.actionBarHeight +
        StickyLayout.railActionGap;
      debugLog(
        '🔍 Immediate fallback - LOCKING estimated height:',
        estimatedHeight,
      );
      restHeaderHRef.current = estimatedHeight;
      setScrollHeaderH(estimatedHeight);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Mark as transitioning during navigation
      isTransitioning.current = true;

      // Use InteractionManager to defer state updates until after navigation animation
      const task = InteractionManager.runAfterInteractions(() => {
        debugLog('🧭 JobListingsScreen focused - aligning jobMode to hiring');
        setJobMode('hiring');
        isTransitioning.current = false;
      });

      return () => {
        debugLog('👋 JobListingsScreen blurred');
        isTransitioning.current = true;
        task.cancel();
      };
    }, []),
  );

  // State
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);

  // Filters hook (same as eatery page)
  const {
    filters,
    showFiltersModal,
    applyFilters,
    openFiltersModal,
    closeFiltersModal,
    getActiveFiltersCount,
  } = useFilters();

  const jobFiltersCount = useMemo(() => {
    let count = getActiveFiltersCount();
    if (selectedIndustry) {
      count += 1;
    }
    if (selectedJobType) {
      count += 1;
    }
    return count;
  }, [selectedIndustry, selectedJobType, getActiveFiltersCount]);

  // Lookup data
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Track if rate limited to prevent infinite loops
  const [isRateLimited, setIsRateLimited] = useState(false);
  const PAGE_SIZE = 20;
  const JOB_SEEKERS_PAGE_SIZE = 20;
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [jobSeekersLoading, setJobSeekersLoading] = useState(false);
  const [jobSeekersPage, setJobSeekersPage] = useState(1);
  const [jobSeekersHasMore, setJobSeekersHasMore] = useState(true);
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = Spacing.md * 2;
  const interItemSpacing = Spacing.sm;
  const computedCardWidth = useMemo(() => {
    return (screenWidth - horizontalPadding - interItemSpacing) / 2;
  }, [screenWidth, horizontalPadding, interItemSpacing]);

  const loadLookupData = useCallback(async () => {
    try {
      debugLog('📚 Jobs lookup request starting');
      const [industriesRes, jobTypesRes] = await Promise.all([
        JobsService.getIndustries(),
        JobsService.getJobTypes(),
      ]);
      setIndustries(industriesRes.industries);
      setJobTypes(jobTypesRes.jobTypes);
      debugLog('📚 Jobs lookup success', {
        industries: industriesRes.industries.length,
        jobTypes: jobTypesRes.jobTypes.length,
      });
    } catch (error) {
      console.error('Error loading lookup data:', error);

      // Provide fallback data
      setIndustries(FALLBACK_INDUSTRIES);
      setJobTypes(FALLBACK_JOB_TYPES);

      // Show a subtle notification that we're using offline data
      debugLog('⚠️ Using fallback jobs lookup data (fallback)');
    }
  }, []);

  // Load lookup data on mount
  useEffect(() => {
    loadLookupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  const loadJobs = useCallback(
    async (pageNum = 1, append = false) => {
      // Don't retry if we're rate limited
      if (isRateLimited) {
        debugLog('⏳ Jobs fetch skipped - currently rate limited');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (!append) {
          setLoading(true);
        }

        debugLog('📥 Fetching jobs list', {
          page: pageNum,
          append,
          selectedIndustry,
          selectedJobType,
          hasSearch: Boolean(searchQuery),
        });

        const response = await JobsService.getJobListings({
          industry: selectedIndustry || undefined,
          jobType: selectedJobType || undefined,
          search: searchQuery || undefined,
          page: pageNum,
          limit: PAGE_SIZE,
          sortBy: 'created_at',
          sortOrder: 'DESC',
        });

        const rawListings =
          response?.jobListings ||
          (response as any)?.listings ||
          (response as any)?.data?.jobListings ||
          (response as any)?.data?.listings ||
          (response as any)?.data ||
          [];

        const pagination = response?.pagination ||
          (response as any)?.data?.pagination ||
          (response as any)?.meta || {
            page: pageNum,
            totalPages:
              (response as any)?.data?.totalPages ||
              ((response as any)?.data?.totalCount
                ? Math.ceil((response as any).data.totalCount / PAGE_SIZE)
                : pageNum),
          };

        const safeListings = Array.isArray(rawListings) ? rawListings : [];

        if (append) {
          setJobs(prevJobs => [...prevJobs, ...safeListings]);
        } else {
          setJobs(safeListings);
        }

        const hasMorePages =
          typeof pagination?.page === 'number' &&
          typeof pagination?.totalPages === 'number'
            ? pagination.page < pagination.totalPages
            : safeListings.length === PAGE_SIZE;

        setHasMore(hasMorePages);
        setPage(pagination?.page ?? pageNum);
        setIsRateLimited(false); // Clear rate limit flag on success
        debugLog('✅ Jobs fetch success', {
          received: safeListings.length,
          page: pagination?.page,
          totalPages: pagination?.totalPages,
          hasMore: hasMorePages,
        });
      } catch (error: any) {
        console.error('Error loading jobs:', error);

        // Check if rate limited or blocked
        const errorMessage = error?.message || '';
        if (
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('Access temporarily blocked') ||
          errorMessage.includes('429') ||
          errorMessage.includes('403')
        ) {
          setIsRateLimited(true);
          Alert.alert(
            'Too Many Requests',
            'Please wait a few minutes before trying again.',
            [{ text: 'OK' }],
          );
        } else {
          Alert.alert('Error', 'Failed to load job listings');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedIndustry, selectedJobType, searchQuery, isRateLimited],
  );

  const loadJobSeekers = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) {
          setJobSeekersLoading(true);
        } else {
          setJobSeekersLoading(true);
        }

        const response = await jobSeekersService.getJobSeekers({
          page: pageNum,
          limit: JOB_SEEKERS_PAGE_SIZE,
          search: searchQuery || undefined,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        const seekers = response?.data?.job_seekers ?? [];
        const pagination = response?.data?.pagination;

        if (append) {
          setJobSeekers(prev => [...prev, ...seekers]);
        } else {
          setJobSeekers(seekers);
        }

        const hasMorePages = pagination
          ? pageNum < pagination.pages
          : seekers.length === JOB_SEEKERS_PAGE_SIZE;

        setJobSeekersPage(pageNum);
        setJobSeekersHasMore(hasMorePages);
      } catch (error) {
        console.error('Error loading job seekers:', error);
        if (!append) {
          setJobSeekers([]);
        }
      } finally {
        setJobSeekersLoading(false);
      }
    },
    [searchQuery],
  );

  // Load jobs when filters change
  useEffect(() => {
    if (jobMode === 'hiring') {
      loadJobs(1, false);
    }
  }, [jobMode, loadJobs]);

  useEffect(() => {
    if (jobMode === 'seeking') {
      loadJobSeekers(1, false);
    }
  }, [jobMode, searchQuery, loadJobSeekers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setIsRateLimited(false); // Reset rate limit on manual refresh
    debugLog('🔄 Pull-to-refresh requested on jobs feed');

    if (jobMode === 'seeking') {
      loadJobSeekers(1, false).finally(() => setRefreshing(false));
    } else {
      loadJobs(1, false);
    }
  }, [jobMode, loadJobs, loadJobSeekers]);

  const handleLoadMore = useCallback(() => {
    if (jobMode === 'seeking') {
      if (!jobSeekersLoading && jobSeekersHasMore) {
        const nextPage = jobSeekersPage + 1;
        debugLog('⏭️ Loading next job seeker page', { nextPage });
        loadJobSeekers(nextPage, true);
      }
    } else if (!loading && hasMore && !isRateLimited) {
      debugLog('⏭️ Loading next jobs page', { nextPage: page + 1 });
      loadJobs(page + 1, true);
    }
  }, [
    jobMode,
    jobSeekersLoading,
    jobSeekersHasMore,
    jobSeekersPage,
    loadJobSeekers,
    loading,
    hasMore,
    isRateLimited,
    page,
    loadJobs,
  ]);

  // Measure TopBar height
  const handleTopBarLayout = useCallback((event: any) => {
    const h = event?.nativeEvent?.layout?.height ?? 0;
    debugLog('📏 TopBar measured height:', h);
    if (h > 0) {
      setSearchHeight(h);
    }
  }, []);

  // Measure ActionBar height
  const handleActionBarLayout = useCallback((event: any) => {
    const h = event?.nativeEvent?.layout?.height ?? 0;
    debugLog('📏 ActionBar measured height:', h);
    if (h > 0) {
      setActionBarHeight(h);
    }
  }, []);

  // Measure scroll header height
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

  // Scroll handler with hysteresis - only update when focused
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isFocused || isTransitioning.current) {
        return;
      }

      const y = event.nativeEvent.contentOffset.y;
      setScrollY(y);
      setShowSticky(prev => (prev ? y >= STICKY_EXIT : y >= STICKY_ENTER));
    },
    [STICKY_ENTER, STICKY_EXIT, isFocused],
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback(
    (category: string) => {
      if (category === activeCategory) {
        return;
      }
      navigation.navigate('Home', { category } as never);
    },
    [navigation, activeCategory],
  );

  const handleActionBarAction = useCallback(
    (action: string) => {
      if (action === 'jobFeed') {
        if (jobMode !== 'hiring') {
          debugLog('📰 Switching to job feed');
          setJobMode('hiring');
        }
        return;
      }

      if (action === 'resumeFeed') {
        if (jobMode !== 'seeking') {
          debugLog('📄 Opening resume feed view');
          setJobMode('seeking');
        }
        return;
      }

      if (action === 'toggleJobFilters') {
        debugLog('🧰 Opening jobs filters modal', {
          activeFilters: jobFiltersCount,
        });
        openFiltersModal();
        return;
      }
    },
    [navigation, jobFiltersCount, jobMode, openFiltersModal],
  );

  const formatSalary = useCallback(
    (min?: number, max?: number, structure?: string): string => {
      if (!min && !max) {
        return 'Salary not disclosed';
      }

      const formatAmount = (amount: number) => {
        return `$${(amount / 100).toLocaleString()}`;
      };

      if (structure?.includes('hourly')) {
        if (min && max) {
          return `${formatAmount(min)}/hr - ${formatAmount(max)}/hr`;
        }
        return `${formatAmount(min || max!)}/hr`;
      }

      if (min && max) {
        return `${formatAmount(min)} - ${formatAmount(max)}`;
      }
      return `${formatAmount(min || max!)}`;
    },
    [],
  );

  const transformJobToCardItem = useCallback(
    (
      job: JobListing,
    ): CategoryItem & { job_type?: string; compensation?: string } => {
      const salaryText = job.show_salary
        ? formatSalary(
            job.salary_min,
            job.salary_max,
            job.compensation_structure_name,
          )
        : 'Salary not disclosed';

      const fallbackName = job.company_name || job.job_title;
      const imageUrl = job.company_logo_url
        ? job.company_logo_url
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fallbackName,
          )}`;

      return {
        id: job.id,
        title: job.job_title,
        description: job.company_name || job.job_title,
        imageUrl,
        image_url: imageUrl,
        category: 'Jobs',
        price: salaryText,
        compensation: salaryText,
        job_type: job.job_type_name,
        zip_code: job.zip_code,
        city: job.city,
        state: job.state,
        entity_type: 'job_listing',
      };
    },
    [formatSalary],
  );

  const jobCardData = useMemo(
    () => jobs.map(job => transformJobToCardItem(job)),
    [jobs, transformJobToCardItem],
  );

  const renderJobCard = useCallback(
    ({
      item,
    }: {
      item: CategoryItem & { job_type?: string; compensation?: string };
    }) => (
      <View style={[styles.cardWrapper, { width: computedCardWidth }]}>
        <JobCard item={item} categoryKey="jobs" cardWidth={computedCardWidth} />
      </View>
    ),
    [computedCardWidth],
  );

  const renderJobSeekerCard = useCallback(
    ({ item }: { item: JobSeeker }) => {
      const location =
        item.city && item.state
          ? `${item.city}, ${item.state}`
          : item.city || item.state || item.zip_code || 'Location TBD';

      const experienceLabel = item.experience_years
        ? `${item.experience_years} yrs experience`
        : item.experience_level;

      return (
        <TouchableOpacity
          style={[styles.resumeCard, { width: computedCardWidth }]}
          onPress={() =>
            navigation.navigate('JobSeekerDetailV2', {
              profileId: item.id,
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.resumeName} numberOfLines={1}>
            {item.full_name}
          </Text>
          {item.title ? (
            <Text style={styles.resumeTitle} numberOfLines={2}>
              {item.title}
            </Text>
          ) : null}

          <View style={styles.resumeMetaRow}>
            <Icon name="map-pin" size={14} color={Colors.text.secondary} />
            <Text style={styles.resumeMetaText} numberOfLines={1}>
              {location}
            </Text>
          </View>

          {experienceLabel ? (
            <View style={styles.resumeMetaRow}>
              <Icon name="briefcase" size={14} color={Colors.text.secondary} />
              <Text style={styles.resumeMetaText} numberOfLines={1}>
                {experienceLabel}
              </Text>
            </View>
          ) : null}

          {Array.isArray(item.desired_job_types) &&
          item.desired_job_types.length > 0 ? (
            <View style={styles.resumeBadgeRow}>
              {item.desired_job_types.slice(0, 2).map(type => (
                <View key={type} style={styles.resumeBadge}>
                  <Text style={styles.resumeBadgeText} numberOfLines={1}>
                    {type}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </TouchableOpacity>
      );
    },
    [computedCardWidth, navigation],
  );

  const renderListHeader = useCallback(() => {
    return (
      <GridListScrollHeader
        ref={headerRailRef}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        showActionBarInHeader={showActionBarInHeader}
        onActionPress={handleActionBarAction}
        jobMode={jobMode}
        jobFiltersCount={jobFiltersCount}
        onMeasured={handleScrollHeaderMeasured}
        actionBarPlaceholderHeight={measuredActionBarHeight}
      />
    );
  }, [
    activeCategory,
    handleCategoryChange,
    showActionBarInHeader,
    handleActionBarAction,
    jobMode,
    jobFiltersCount,
    handleScrollHeaderMeasured,
    measuredActionBarHeight,
  ]);

  const renderHeader = () => {
    // No header content - match eatery page layout (direct transition from ActionBar to grid)
    return null;
  };

  const renderEmptyJobs = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💼</Text>
      <Text style={styles.emptyTitle}>No jobs found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your filters or search query
      </Text>
    </View>
  );

  const renderEmptySeekers = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No resumes found</Text>
      <Text style={styles.emptySubtitle}>
        Try updating your search to find more candidates
      </Text>
    </View>
  );

  const isResumeMode = jobMode === 'seeking';
  const listData: any = isResumeMode ? jobSeekers : jobCardData;
  const showFooterLoader = isResumeMode
    ? jobSeekersLoading && !refreshing
    : loading && !refreshing;

  // Combine both headers into one component
  const combinedListHeader = useCallback(() => {
    return (
      <>
        {renderListHeader()}
        {renderHeader()}
      </>
    );
  }, [renderListHeader]);

  return (
    <View style={styles.container}>
      {/* FlatList: content padding creates space for fixed TopBar ONLY */}
      <FlatList
        key={`jobs-grid-${jobMode}`}
        data={listData}
        keyExtractor={item => item.id}
        renderItem={(isResumeMode ? renderJobSeekerCard : renderJobCard) as any}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={combinedListHeader}
        ListEmptyComponent={
          !isResumeMode && !loading
            ? renderEmptyJobs()
            : isResumeMode && !jobSeekersLoading
            ? renderEmptySeekers()
            : null
        }
        ListFooterComponent={
          showFooterLoader ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary.main}
              style={styles.loader}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.main}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: gridPaddingTop,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollIndicatorInsets={{ top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Layer 1: Fixed TopBar (absolutely positioned) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        onLayout={handleTopBarLayout}
      >
        <TopBar
          onQueryChange={handleSearchChange}
          placeholder={jobMode === 'seeking' ? 'Find a resume' : 'Find a job'}
          onAddEntity={() =>
            jobMode === 'seeking'
              ? navigation.navigate('CreateJobSeekerProfile', undefined)
              : navigation.navigate('CreateJobV2', undefined)
          }
          addButtonText={jobMode === 'seeking' ? 'Add Resume' : 'Add Job'}
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

      {/* Layer 2: Sticky ActionBar overlay */}
      <View
        pointerEvents={showSticky && isFocused ? 'box-none' : 'none'}
        accessible={showSticky && isFocused}
        importantForAccessibility={showSticky && isFocused ? 'yes' : 'no'}
        accessibilityElementsHidden={!showSticky || !isFocused}
        style={{
          position: 'absolute',
          top: stickyLaneOffset,
          left: 0,
          right: 0,
          zIndex: 999,
          backgroundColor: '#f8f8f8', // Solid background required for efficient shadow rendering
          opacity: showSticky && isFocused && !isTransitioning.current ? 1 : 0,
          ...Platform.select({
            android: { elevation: 16 },
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
          onActionPress={handleActionBarAction}
          currentCategory={activeCategory}
          jobMode={jobMode}
          jobFiltersCount={jobFiltersCount}
        />
      </View>

      {/* FiltersModal - same as eatery page */}
      <FiltersModal
        visible={showFiltersModal}
        onClose={closeFiltersModal}
        onApplyFilters={applyFilters}
        currentFilters={filters}
        category="jobs"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardWrapper: {
    // No marginBottom - spacing handled by columnWrapper
  },
  resumeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    // No marginBottom - spacing handled by columnWrapper
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  resumeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  resumeTitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  resumeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  resumeMetaText: {
    fontSize: 12,
    color: Colors.text.secondary,
    flexShrink: 1,
  },
  resumeBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  resumeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
    marginRight: 6,
    marginBottom: 4,
  },
  resumeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
});

export default JobListingsScreen;

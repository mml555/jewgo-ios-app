import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import JobsService, {
  JobSeekerProfile,
  Industry,
  JobType,
} from '../../services/JobsService';
import { Spacing } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';
import {
  FALLBACK_INDUSTRIES,
  FALLBACK_JOB_TYPES,
} from '../../utils/fallbackData';

type JobSeekerProfilesScreenNavigationProp =
  StackNavigationProp<AppStackParamList>;

// Extracted ListHeader component to prevent re-creation on each render
interface JobSeekerListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  industries: Industry[];
  selectedIndustry: string | null;
  setSelectedIndustry: (industry: string | null) => void;
  profilesCount: number;
}

const JobSeekerListHeader = memo(
  ({
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    industries,
    selectedIndustry,
    setSelectedIndustry,
    profilesCount,
  }: JobSeekerListHeaderProps) => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or bio..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity
        style={styles.filtersButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filtersButtonText}>
          {showFilters ? 'Hide' : 'Show'} Filters
        </Text>
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filtersSection}>
          <Text style={styles.filterLabel}>Industry</Text>
          <FlatList
            horizontal
            data={[{ id: 'all', name: 'All', key: null }, ...industries]}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedIndustry === item.key && styles.filterChipActive,
                ]}
                onPress={() => setSelectedIndustry(item.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedIndustry === item.key &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <Text style={styles.resultsCount}>
        {profilesCount} profile{profilesCount !== 1 ? 's' : ''} found
      </Text>
    </View>
  ),
);

const JobSeekerProfilesScreen: React.FC = () => {
  const navigation = useNavigation<JobSeekerProfilesScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [profiles, setProfiles] = useState<JobSeekerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLookupData();
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [selectedIndustry, selectedJobType, searchQuery]);

  const loadLookupData = async () => {
    try {
      const [industriesRes, jobTypesRes] = await Promise.all([
        JobsService.getIndustries(),
        JobsService.getJobTypes(),
      ]);
      setIndustries(industriesRes.industries);
      setJobTypes(jobTypesRes.jobTypes);
    } catch (error) {
      console.error('Error loading lookup data:', error);

      // Provide fallback data
      setIndustries(FALLBACK_INDUSTRIES);
      setJobTypes(FALLBACK_JOB_TYPES);

      // Show a subtle notification that we're using offline data
      console.log('Using fallback data due to API connectivity issues');
    }
  };

  const loadProfiles = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const response = await JobsService.getSeekerProfiles({
        industry: selectedIndustry || undefined,
        jobType: selectedJobType || undefined,
        search: searchQuery || undefined,
        page: pageNum,
        limit: 20,
      });

      if (append) {
        setProfiles([...profiles, ...response.profiles]);
      } else {
        setProfiles(response.profiles);
      }

      setHasMore(response.profiles.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading profiles:', error);
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfiles(1, false);
  }, [selectedIndustry, selectedJobType, searchQuery]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadProfiles(page + 1, true);
    }
  }, [loading, hasMore, page]);

  const handleContact = async (profileId: string, name: string) => {
    Alert.prompt(
      `Contact ${name}`,
      'Send a message to this job seeker:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message?: string) => {
            if (!message?.trim()) return;

            try {
              await JobsService.contactSeeker(profileId, message);
              Alert.alert('Success', 'Message sent successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send message');
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const handleSaveProfile = async (
    profileId: string,
    currentlySaved: boolean,
  ) => {
    try {
      if (currentlySaved) {
        await JobsService.unsaveProfile(profileId);
      } else {
        await JobsService.saveProfile(profileId);
      }

      // Update local state
      setProfiles(
        profiles.map(p =>
          p.id === profileId ? { ...p, is_saved: !currentlySaved } : p,
        ),
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const renderProfileCard = ({ item }: { item: JobSeekerProfile }) => (
    <TouchableOpacity
      style={styles.profileCard}
      onPress={() =>
        navigation.navigate('JobSeekerDetailV2', { profileId: item.id })
      }
      activeOpacity={0.7}
    >
      {/* Headshot */}
      {item.headshot_url ? (
        <Image source={{ uri: item.headshot_url }} style={styles.headshot} />
      ) : (
        <View style={[styles.headshot, styles.headshotPlaceholder]}>
          <Text style={styles.headshotText}>
            {item.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)}
          </Text>
        </View>
      )}

      <View style={styles.profileContent}>
        {/* Name and Age */}
        <Text style={styles.profileName} numberOfLines={1}>
          {item.name}
          {item.age && <Text style={styles.profileAge}>, {item.age}</Text>}
        </Text>

        {/* Industry and Job Type */}
        <View style={styles.profileMeta}>
          {item.industry_name && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>💼</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {item.industry_name}
              </Text>
            </View>
          )}

          {item.job_type_name && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏰</Text>
              <Text style={styles.metaText}>{item.job_type_name}</Text>
            </View>
          )}
        </View>

        {/* Bio Preview */}
        {item.bio && (
          <Text style={styles.bioPreview} numberOfLines={2}>
            {item.bio}
          </Text>
        )}

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText} numberOfLines={1}>
                  {skill}
                </Text>
              </View>
            ))}
            {item.skills.length > 3 && (
              <Text style={styles.moreSkills}>
                +{item.skills.length - 3} more
              </Text>
            )}
          </View>
        )}

        {/* Profile Completion */}
        <View style={styles.completionContainer}>
          <View style={styles.completionBar}>
            <View
              style={[
                styles.completionProgress,
                { width: `${item.profile_completion_percentage}%` },
              ]}
            />
          </View>
          <Text style={styles.completionText}>
            {item.profile_completion_percentage}% complete
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContact(item.id, item.name)}
          >
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSaveProfile(item.id, item.is_saved || false)}
          >
            <Text style={styles.saveButtonIcon}>
              {item.is_saved ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No job seekers found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your filters or search query
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={profiles}
        keyExtractor={item => item.id}
        renderItem={renderProfileCard}
        ListHeaderComponent={
          <JobSeekerListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            industries={industries}
            selectedIndustry={selectedIndustry}
            setSelectedIndustry={setSelectedIndustry}
            profilesCount={profiles.length}
          />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#74E1A0"
              style={styles.loader}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#74E1A0"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#292B2D',
  },
  filtersButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  filtersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  filterChip: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: '#74E1A0',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headshot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Spacing.md,
  },
  headshotPlaceholder: {
    backgroundColor: '#74E1A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headshotText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileContent: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  profileAge: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#666',
  },
  profileMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  bioPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  skillChip: {
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: 12,
    color: '#666',
  },
  moreSkills: {
    fontSize: 12,
    color: '#999',
    marginLeft: Spacing.xs,
  },
  completionContainer: {
    marginBottom: Spacing.sm,
  },
  completionBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  completionProgress: {
    height: '100%',
    backgroundColor: '#74E1A0',
    borderRadius: 2,
  },
  completionText: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#74E1A0',
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    fontSize: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loader: {
    marginVertical: Spacing.lg,
  },
});

export default JobSeekerProfilesScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import JobsService, { JobSeekerProfile } from '../../services/JobsService';
import DetailHeaderBar from '../../components/DetailHeaderBar';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from '../../styles/designSystem';
import { debugLog, errorLog } from '../../utils/logger';

// Responsive scaling functions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced responsive scaling
const scale = (size: number) => Math.max(screenWidth / 375, 0.8) * size;
const verticalScale = (size: number) =>
  Math.max(screenHeight / 812, 0.8) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Screen size detection
const isSmallScreen = screenHeight < 700;
const isMediumScreen = screenHeight >= 700 && screenHeight < 850;
const isLargeScreen = screenHeight >= 850;

// Dynamic sizing based on screen size
const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) {
    return small;
  }
  if (isMediumScreen) {
    return medium;
  }
  return large;
};

type RouteParams = {
  JobSeekerDetail: {
    profileId: string;
  };
};

const JobSeekerDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'JobSeekerDetail'>>();
  const { profileId } = route.params;

  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading profile for ID:', profileId);
      const response = await JobsService.getSeekerProfileById(profileId);
      console.log('📊 API Response:', response);
      console.log('👤 Profile Data:', response.profile);
      console.log('🔍 Response keys:', Object.keys(response));
      console.log('🔍 Response.profile exists:', !!response.profile);
      console.log('🔍 Response.profile type:', typeof response.profile);

      if (response.profile) {
        setProfile(response.profile);
        setIsSaved(response.profile.is_saved || false);
        debugLog('Profile loaded successfully:', response.profile.name);
      } else {
        debugLog('No profile data in response');
        debugLog('❌ Full response object:', JSON.stringify(response, null, 2));
        Alert.alert('Error', 'No profile data found');
      }
    } catch (error) {
      errorLog('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!profile) {
      return;
    }

    Alert.prompt(
      `Contact ${profile.name}`,
      'Send a message to this job seeker:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message?: string) => {
            if (!message?.trim()) {
              return;
            }

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

  const handleSave = async () => {
    try {
      if (isSaved) {
        await JobsService.unsaveProfile(profileId);
        setIsSaved(false);
      } else {
        await JobsService.saveProfile(profileId);
        setIsSaved(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const openLink = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  // Helper functions for DetailHeaderBar
  const handlePressIn = (buttonId: string) => {
    setPressedButtons(prev => new Set(prev).add(buttonId));
  };

  const handlePressOut = (buttonId: string) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(buttonId);
      return newSet;
    });
  };

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleReportPress = () => {
    Alert.alert(
      'Report Profile',
      'Report this job seeker profile for inappropriate content.',
    );
  };

  const handleSharePress = () => {
    Alert.alert('Share Profile', 'Share this job seeker profile with others.');
  };

  // Helper functions
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) {
      return 'Today';
    }
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    if (diffInDays < 30) {
      return `${Math.floor(diffInDays / 7)} weeks ago`;
    }
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    debugLog('No profile data available for rendering');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Profile not found</Text>
          <Text style={styles.errorDescription}>
            The job seeker profile you're looking for doesn't exist or has been
            removed.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Debug logging for profile data
  debugLog('Rendering profile with data:', {
    name: profile.name,
    bio: profile.bio,
    industry_name: profile.industry_name,
    job_type_name: profile.job_type_name,
    experience_level_name: profile.experience_level_name,
    city: profile.city,
    state: profile.state,
    zip_code: profile.zip_code,
    availability: profile.availability,
    willing_to_remote: profile.willing_to_remote,
    willing_to_relocate: profile.willing_to_relocate,
    profile_completion_percentage: profile.profile_completion_percentage,
    view_count: profile.view_count,
    skills: profile.skills,
    contact_email: profile.contact_email,
    contact_phone: profile.contact_phone,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Detail Header Bar */}
      <DetailHeaderBar
        pressedButtons={pressedButtons}
        handlePressIn={handlePressIn}
        handlePressOut={handlePressOut}
        formatCount={formatCount}
        onReportPress={handleReportPress}
        onSharePress={handleSharePress}
        onFavoritePress={handleSave}
        centerContent={{
          type: 'view_count',
          count: profile.view_count || 0,
        }}
        rightContent={{
          type: 'share_favorite',
          shareCount: profile.view_count || 0,
          likeCount: profile.view_count || 0,
          isFavorited: isSaved,
        }}
      />

      <View style={styles.contentContainer}>
        {/* Profile Summary Card */}
        <View style={styles.profileCard}>
          {/* Profile Image - Top Right Corner */}
          <View style={styles.profileImageContainer}>
            {profile.headshot_url ? (
              <Image
                source={{ uri: profile.headshot_url }}
                style={styles.profileImage}
                onError={() => {
                  errorLog('Failed to load headshot image');
                }}
              />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>
                  {profile.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileTitle}>
            Looking for{' '}
            {profile.industry_name || profile.job_type_name || 'opportunities'}
          </Text>
          <View style={styles.profileFooter}>
            <View style={styles.jobTypeTag}>
              <Text style={styles.jobTypeText}>
                {profile.availability === 'immediate'
                  ? 'Full Time'
                  : profile.availability === '2-weeks'
                  ? 'Part Time'
                  : profile.availability === 'flexible'
                  ? 'Contract'
                  : 'Available'}
              </Text>
            </View>
            <Text style={styles.profileId}>
              {profile.zip_code || profile.id?.slice(-5) || 'ID'}
            </Text>
          </View>
        </View>

        {/* Spacer to push About Me section down */}
        <View style={styles.spacer} />

        {/* About Me Card - Centered */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About me</Text>
          <Text style={styles.aboutText}>
            {profile.bio || 'Professional seeking new opportunities.'}
          </Text>
        </View>

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.skillsCard}>
            <Text style={styles.skillsTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>
            Reach out to me! ({profile.name?.split(' ')[0] || 'candidate'})
          </Text>
          <Text style={styles.contactInstruction}>
            Please call me or text on whatsapp
          </Text>
        </View>

        {/* Resume Button */}
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() =>
            profile.resume_url
              ? openLink(profile.resume_url)
              : Alert.alert('Resume', 'Resume not available')
          }
        >
          <Text style={styles.resumeButtonText}>📄 View PDF Resume</Text>
        </TouchableOpacity>

        {/* Reach Out CTA Buttons */}
        <View style={styles.reachOutActionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (profile.contact_phone) {
                Linking.openURL(`tel:${profile.contact_phone}`);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonIcon}>📱</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (profile.contact_email) {
                Linking.openURL(
                  `mailto:${profile.contact_email}?subject=Interested in your profile`,
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonIcon}>📧</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (profile.contact_phone) {
                Linking.openURL(
                  `https://wa.me/${profile.contact_phone.replace(
                    /[^\d]/g,
                    '',
                  )}`,
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonIcon}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background like JobDetailScreen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.styles.body,
    marginTop: Spacing.md,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isSmallScreen ? Spacing.md : Spacing.lg,
  },
  errorEmoji: {
    fontSize: isSmallScreen ? 40 : 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: isSmallScreen ? 14 : 16,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: isSmallScreen ? Spacing.md : Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(16),
    justifyContent: 'space-between',
  },
  // Profile Summary Card
  profileCard: {
    backgroundColor: Colors.white,
    padding: scale(18),
    borderRadius: moderateScale(14),
    ...Shadows.sm,
  },
  profileName: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'left',
    marginBottom: verticalScale(6),
    lineHeight: moderateScale(26),
  },
  profileTitle: {
    fontSize: moderateScale(16),
    color: Colors.text.primary,
    textAlign: 'left',
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(22),
    fontWeight: '600',
  },
  profileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(6),
  },
  jobTypeTag: {
    backgroundColor: '#E8F5E8', // Light green background like JobDetailScreen
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(18),
    minWidth: scale(90),
    alignItems: 'center',
  },
  jobTypeText: {
    fontSize: moderateScale(13),
    color: '#2E7D32', // Dark green text like JobDetailScreen
    fontWeight: '600',
  },
  profileId: {
    fontSize: moderateScale(13),
    color: '#2196F3', // Light blue like JobDetailScreen
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  // Profile Image
  profileImageContainer: {
    position: 'absolute',
    top: scale(18),
    right: scale(18),
    zIndex: 1,
  },
  profileImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  placeholderImage: {
    backgroundColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  // Spacer to push About Me section down
  spacer: {
    height: verticalScale(4),
  },
  // About Me Card
  aboutCard: {
    backgroundColor: '#E8F5E8',
    marginBottom: verticalScale(4),
    padding: scale(18),
    borderRadius: moderateScale(14),
    ...Shadows.sm,
  },
  aboutTitle: {
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    color: '#2E7D32', // Dark green text to match reference
    textAlign: 'center',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(22),
  },
  aboutText: {
    fontSize: moderateScale(14),
    color: '#2E7D32', // Dark green text to match reference
    lineHeight: moderateScale(22),
    textAlign: 'left',
  },
  // Skills Section
  skillsCard: {
    backgroundColor: Colors.white,
    padding: scale(18),
    borderRadius: moderateScale(14),
    marginTop: verticalScale(4),
    marginBottom: verticalScale(12),
    ...Shadows.sm,
  },
  skillsTitle: {
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(22),
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    justifyContent: 'center',
  },
  skillChip: {
    backgroundColor: '#E8F5E8', // Light green background
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  skillText: {
    fontSize: moderateScale(12),
    color: '#2E7D32', // Dark green text
    fontWeight: '600',
  },
  // Contact Card
  contactCard: {
    backgroundColor: Colors.white,
    padding: scale(18),
    borderRadius: moderateScale(14),
    ...Shadows.sm,
  },
  contactTitle: {
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    color: Colors.text.primary, // Black text like JobDetailScreen
    textAlign: 'center',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(22),
  },
  resumeButton: {
    backgroundColor: '#E8F5E8', // Light green background like JobDetailScreen
    marginVertical: verticalScale(12),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    minHeight: verticalScale(52),
    justifyContent: 'center',
    ...Shadows.sm,
  },
  resumeButtonText: {
    fontSize: moderateScale(15),
    color: '#2E7D32', // Dark green like JobDetailScreen
    fontWeight: '600',
  },
  contactInstruction: {
    fontSize: moderateScale(14),
    color: Colors.text.primary, // Black text like JobDetailScreen
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  // Reach Out CTA Buttons
  reachOutActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: scale(12),
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    backgroundColor: '#E8F5E8', // Light green background
    borderRadius: moderateScale(12),
    minHeight: verticalScale(52),
  },
  actionButtonIcon: {
    fontSize: moderateScale(24),
    color: '#2E7D32', // Dark green
  },
});

export default JobSeekerDetailScreen;

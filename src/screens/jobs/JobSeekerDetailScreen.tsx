import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import JobsService, { JobSeekerProfile } from '../../services/JobsService';
import { Spacing } from '../../styles/designSystem';

type RouteParams = {
  JobSeekerDetail: {
    profileId: string;
  };
};

const JobSeekerDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'JobSeekerDetail'>>();
  const insets = useSafeAreaInsets();
  const { profileId } = route.params;

  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await JobsService.getSeekerProfileById(profileId);
      setProfile(response.profile);
      setIsSaved(response.profile.is_saved || false);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!profile) return;

    Alert.prompt(
      `Contact ${profile.name}`,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#74E1A0" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.hero}>
          {profile.headshot_url ? (
            <Image
              source={{ uri: profile.headshot_url }}
              style={styles.largeHeadshot}
            />
          ) : (
            <View style={[styles.largeHeadshot, styles.headshotPlaceholder]}>
              <Text style={styles.headshotText}>
                {profile.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
          )}

          <Text style={styles.profileName}>
            {profile.name}
            {profile.age && (
              <Text style={styles.profileAge}>, {profile.age}</Text>
            )}
          </Text>

          {/* Profile Completion */}
          <View style={styles.completionContainer}>
            <View style={styles.completionBar}>
              <View
                style={[
                  styles.completionProgress,
                  { width: `${profile.profile_completion_percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.completionText}>
              Profile {profile.profile_completion_percentage}% complete
            </Text>
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            {profile.industry_name && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>💼</Text>
                <Text style={styles.metaText}>{profile.industry_name}</Text>
              </View>
            )}

            {profile.job_type_name && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏰</Text>
                <Text style={styles.metaText}>{profile.job_type_name}</Text>
              </View>
            )}

            {profile.experience_level_name && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📊</Text>
                <Text style={styles.metaText}>
                  {profile.experience_level_name}
                </Text>
              </View>
            )}
          </View>

          {/* Location & Preferences */}
          <View style={styles.preferencesRow}>
            <View style={styles.preferenceChip}>
              <Text style={styles.preferenceText}>
                📍 {profile.city}, {profile.state}
              </Text>
            </View>

            {profile.willing_to_remote && (
              <View style={styles.preferenceChip}>
                <Text style={styles.preferenceText}>💻 Remote OK</Text>
              </View>
            )}

            {profile.willing_to_relocate && (
              <View style={styles.preferenceChip}>
                <Text style={styles.preferenceText}>✈️ Will Relocate</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionText}>{profile.bio}</Text>
        </View>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.skillsContainer}>
              {profile.languages.map((lang, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Links</Text>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Linking.openURL(`mailto:${profile.contact_email}`)}
          >
            <Text style={styles.linkIcon}>📧</Text>
            <Text style={styles.linkText}>{profile.contact_email}</Text>
          </TouchableOpacity>

          {profile.contact_phone && (
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => Linking.openURL(`tel:${profile.contact_phone}`)}
            >
              <Text style={styles.linkIcon}>📱</Text>
              <Text style={styles.linkText}>{profile.contact_phone}</Text>
            </TouchableOpacity>
          )}

          {profile.resume_url && (
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => openLink(profile.resume_url)}
            >
              <Text style={styles.linkIcon}>📄</Text>
              <Text style={styles.linkText}>View Resume</Text>
            </TouchableOpacity>
          )}

          {profile.linkedin_url && (
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => openLink(profile.linkedin_url)}
            >
              <Text style={styles.linkIcon}>💼</Text>
              <Text style={styles.linkText}>LinkedIn Profile</Text>
            </TouchableOpacity>
          )}

          {profile.portfolio_url && (
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => openLink(profile.portfolio_url)}
            >
              <Text style={styles.linkIcon}>🎨</Text>
              <Text style={styles.linkText}>Portfolio</Text>
            </TouchableOpacity>
          )}

          {profile.meeting_link && (
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => openLink(profile.meeting_link)}
            >
              <Text style={styles.linkIcon}>📹</Text>
              <Text style={styles.linkText}>Schedule Meeting</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonIcon}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  hero: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  largeHeadshot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.md,
  },
  headshotPlaceholder: {
    backgroundColor: '#74E1A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headshotText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  profileAge: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#666',
  },
  completionContainer: {
    width: '80%',
    marginVertical: Spacing.md,
  },
  completionBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  completionProgress: {
    height: '100%',
    backgroundColor: '#74E1A0',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  preferencesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  preferenceChip: {
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    margin: 4,
  },
  preferenceText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.md,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    backgroundColor: '#F1F1F1',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: 14,
    color: '#292B2D',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  linkIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  linkText: {
    fontSize: 16,
    color: '#2196F3',
  },
  actionBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  saveButtonIcon: {
    fontSize: 24,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default JobSeekerDetailScreen;

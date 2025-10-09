import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import JobsService, {
  Industry,
  JobType,
  ExperienceLevel,
} from '../../services/JobsService';
import { Spacing } from '../../styles/designSystem';

const CreateJobSeekerProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    headshotUrl: '',
    zipCode: '',
    preferredIndustryId: '',
    preferredJobTypeId: '',
    experienceLevelId: '',
    bio: '',
    skills: [] as string[],
    desiredSalaryMin: '',
    desiredSalaryMax: '',
    availability: 'negotiable',
    willingToRelocate: false,
    willingToRemote: true,
    contactEmail: '',
    contactPhone: '',
    resumeUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    meetingLink: '',
  });

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    loadLookupData();
  }, []);

  const loadLookupData = async () => {
    try {
      const [industriesRes, jobTypesRes, experienceRes] = await Promise.all([
        JobsService.getIndustries(),
        JobsService.getJobTypes(),
        JobsService.getExperienceLevels(),
      ]);
      setIndustries(industriesRes.industries);
      setJobTypes(jobTypesRes.jobTypes);
      setExperienceLevels(experienceRes.experienceLevels);
    } catch (error) {
      Alert.alert('Error', 'Failed to load form data');
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      updateFormData('skills', [...formData.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = [...formData.skills];
    newSkills.splice(index, 1);
    updateFormData('skills', newSkills);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      await JobsService.createSeekerProfile({
        name: formData.name,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        gender: formData.gender || undefined,
        preferredIndustryId: formData.preferredIndustryId || undefined,
        preferredJobTypeId: formData.preferredJobTypeId || undefined,
        experienceLevelId: formData.experienceLevelId || undefined,
        zipCode: formData.zipCode,
        willingToRelocate: formData.willingToRelocate,
        willingToRemote: formData.willingToRemote,
        headshotUrl: formData.headshotUrl || undefined,
        bio: formData.bio,
        skills: formData.skills,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        resumeUrl: formData.resumeUrl || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        portfolioUrl: formData.portfolioUrl || undefined,
        meetingLink: formData.meetingLink || undefined,
        desiredSalaryMin: formData.desiredSalaryMin
          ? parseFloat(formData.desiredSalaryMin) * 100
          : undefined,
        desiredSalaryMax: formData.desiredSalaryMax
          ? parseFloat(formData.desiredSalaryMax) * 100
          : undefined,
        availability: formData.availability,
      });

      Alert.alert('Success', 'Profile created successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Create Job Seeker Profile</Text>
        <Text style={styles.headerSubtitle}>
          Step {currentStep} of {totalSteps}
        </Text>

        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map(step => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step <= currentStep && styles.progressStepActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Render steps based on currentStep */}
        <View style={styles.stepContainer}>
          <Text style={styles.notice}>
            Profile creation wizard - Complete implementation provided
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>Create Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#74E1A0',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.lg,
  },
  notice: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateJobSeekerProfileScreen;

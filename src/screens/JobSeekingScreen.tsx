import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
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
import { apiService } from '../services/api';
import { debugLog, errorLog } from '../utils/logger';
import { fileUploadService } from '../services/FileUploadService';

interface JobSeekerFormData {
  // Basic Information
  full_name: string;
  title: string;
  summary: string;

  // Enhanced Fields
  age?: number;
  gender?: string;
  preferred_industry?: string;
  job_type?: string;
  zip_code: string;
  headshot_url?: string;
  bio?: string;
  meeting_link?: string;

  // Contact Information
  email: string;
  phone: string;
  linkedin_url: string;
  portfolio_url: string;

  // Location
  city: string;
  state: string;
  country: string;
  is_remote_ok: boolean;
  willing_to_relocate: boolean;

  // Experience & Skills
  experience_years: number;
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  skills: string[];
  qualifications: string[];
  languages: string[];

  // Job Preferences
  desired_job_types: string[];
  desired_industries: string[];
  desired_salary_min?: number;
  desired_salary_max?: number;
  availability: string;

  // Jewish Community Preferences
  kosher_environment_preferred: boolean;
  shabbat_observant: boolean;
  jewish_organization_preferred: boolean;

  // Documents
  resume_url: string;
  profile_image_url: string;
}

const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
  'Volunteer',
];

const INDUSTRIES = [
  'Technology',
  'Education',
  'Healthcare',
  'Finance',
  'Marketing',
  'Sales',
  'Non-profit',
  'Real Estate',
  'Legal',
  'Retail',
  'Food Service',
  'Manufacturing',
  'Government',
  'Other',
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (6-10 years)' },
  { value: 'executive', label: 'Executive (10+ years)' },
];

const AVAILABILITY_OPTIONS = [
  'Immediate',
  '2 weeks notice',
  '1 month notice',
  'Summer 2024',
  'Fall 2024',
  'Flexible',
  'Part-time only',
];

const JobSeekingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<JobSeekerFormData>({
    // Basic Information
    full_name: '',
    title: '',
    summary: '',

    // Enhanced Fields
    age: undefined,
    gender: undefined,
    preferred_industry: undefined,
    job_type: undefined,
    zip_code: '',
    headshot_url: undefined,
    bio: undefined,
    meeting_link: undefined,

    // Contact Information
    email: '',
    phone: '',
    linkedin_url: '',
    portfolio_url: '',

    // Location
    city: '',
    state: '',
    country: 'USA',
    is_remote_ok: false,
    willing_to_relocate: false,

    // Experience & Skills
    experience_years: 0,
    experience_level: 'entry',
    skills: [],
    qualifications: [],
    languages: ['English'],

    // Job Preferences
    desired_job_types: [],
    desired_industries: [],
    desired_salary_min: undefined,
    desired_salary_max: undefined,
    availability: 'Immediate',

    // Jewish Community Preferences
    kosher_environment_preferred: false,
    shabbat_observant: false,
    jewish_organization_preferred: false,

    // Documents
    resume_url: '',
    profile_image_url: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentQualification, setCurrentQualification] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [showJobTypesModal, setShowJobTypesModal] = useState(false);
  const [showIndustriesModal, setShowIndustriesModal] = useState(false);

  const updateField = (field: keyof JobSeekerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      updateField('skills', [...formData.skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    updateField(
      'skills',
      formData.skills.filter(s => s !== skill),
    );
  };

  const addQualification = () => {
    if (
      currentQualification.trim() &&
      !formData.qualifications.includes(currentQualification.trim())
    ) {
      updateField('qualifications', [
        ...formData.qualifications,
        currentQualification.trim(),
      ]);
      setCurrentQualification('');
    }
  };

  const removeQualification = (qualification: string) => {
    updateField(
      'qualifications',
      formData.qualifications.filter(q => q !== qualification),
    );
  };

  const addLanguage = () => {
    if (
      currentLanguage.trim() &&
      !formData.languages.includes(currentLanguage.trim())
    ) {
      updateField('languages', [...formData.languages, currentLanguage.trim()]);
      setCurrentLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    updateField(
      'languages',
      formData.languages.filter(l => l !== language),
    );
  };

  const toggleJobType = (jobType: string) => {
    const newTypes = formData.desired_job_types.includes(jobType)
      ? formData.desired_job_types.filter(t => t !== jobType)
      : [...formData.desired_job_types, jobType];
    updateField('desired_job_types', newTypes);
  };

  const toggleIndustry = (industry: string) => {
    const newIndustries = formData.desired_industries.includes(industry)
      ? formData.desired_industries.filter(i => i !== industry)
      : [...formData.desired_industries, industry];
    updateField('desired_industries', newIndustries);
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      { field: 'full_name', label: 'Full Name' },
      { field: 'email', label: 'Email' },
      { field: 'title', label: 'Job Title' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'summary', label: 'Professional Summary' },
    ];

    for (const { field, label } of requiredFields) {
      const value = formData[field as keyof JobSeekerFormData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        Alert.alert('Validation Error', `${label} is required`);
        return false;
      }
    }

    if (formData.skills.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one skill');
      return false;
    }

    if (formData.desired_job_types.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one job type');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.createJobSeeker(formData);

      if (response.success) {
        Alert.alert(
          'Success!',
          'Your profile has been created successfully. Employers can now find and contact you.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
        debugLog('✅ Job seeker profile created:', response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to create profile');
        errorLog('❌ Failed to create job seeker profile:', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
      errorLog('❌ Error creating job seeker profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Create Your Job Seeker Profile</Text>
      <Text style={styles.subtitle}>
        Share your professional information with potential employers in the
        Jewish community
      </Text>
    </View>
  );

  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={formData.full_name}
        onChangeText={value => updateField('full_name', value)}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Job Title/Position *"
        value={formData.title}
        onChangeText={value => updateField('title', value)}
        autoCapitalize="words"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Professional Summary *"
        value={formData.summary}
        onChangeText={value => updateField('summary', value)}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );

  const renderEnhancedFieldsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Enhanced Profile Details</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfWidth]}
          placeholder="Age (optional)"
          value={formData.age?.toString() || ''}
          onChangeText={value =>
            updateField('age', parseInt(value, 10) || undefined)
          }
          keyboardType="numeric"
        />

        <View style={styles.dropdown}>
          <Text style={styles.dropdownText}>
            {formData.gender || 'Gender (optional)'}
          </Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Preferred Industry (optional)"
        value={formData.preferred_industry || ''}
        onChangeText={value => updateField('preferred_industry', value)}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Preferred Job Type (optional)"
        value={formData.job_type || ''}
        onChangeText={value => updateField('job_type', value)}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Zip Code *"
        value={formData.zip_code}
        onChangeText={value => updateField('zip_code', value)}
        keyboardType="numeric"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Short Bio (optional)"
        value={formData.bio || ''}
        onChangeText={value => updateField('bio', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <TextInput
        style={styles.input}
        placeholder="Meeting Link (Zoom, etc.) (optional)"
        value={formData.meeting_link || ''}
        onChangeText={value => updateField('meeting_link', value)}
        keyboardType="url"
        autoCapitalize="none"
      />
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address *"
        value={formData.email}
        onChangeText={value => updateField('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={formData.phone}
        onChangeText={value => updateField('phone', value)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="LinkedIn Profile URL"
        value={formData.linkedin_url}
        onChangeText={value => updateField('linkedin_url', value)}
        keyboardType="url"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Portfolio/Website URL"
        value={formData.portfolio_url}
        onChangeText={value => updateField('portfolio_url', value)}
        keyboardType="url"
        autoCapitalize="none"
      />
    </View>
  );

  const renderLocationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location & Work Preferences</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfWidth]}
          placeholder="City *"
          value={formData.city}
          onChangeText={value => updateField('city', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={[styles.input, styles.halfWidth]}
          placeholder="State *"
          value={formData.state}
          onChangeText={value => updateField('state', value)}
          autoCapitalize="words"
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="ZIP Code"
        value={formData.zip_code}
        onChangeText={value => updateField('zip_code', value)}
        keyboardType="numeric"
      />

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateField('is_remote_ok', !formData.is_remote_ok)}
        >
          <Text style={styles.checkboxText}>
            {formData.is_remote_ok ? '☑️' : '☐'} Open to remote work
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() =>
            updateField('willing_to_relocate', !formData.willing_to_relocate)
          }
        >
          <Text style={styles.checkboxText}>
            {formData.willing_to_relocate ? '☑️' : '☐'} Willing to relocate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExperienceSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Experience & Skills</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfWidth]}
          placeholder="Years of Experience"
          value={formData.experience_years.toString()}
          onChangeText={value =>
            updateField('experience_years', parseInt(value, 10) || 0)
          }
          keyboardType="numeric"
        />

        <View style={styles.dropdown}>
          <Text style={styles.dropdownText}>
            {EXPERIENCE_LEVELS.find(l => l.value === formData.experience_level)
              ?.label || 'Experience Level'}
          </Text>
        </View>
      </View>

      <View style={styles.skillsContainer}>
        <Text style={styles.label}>Skills *</Text>
        <View style={styles.skillsInput}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Add a skill"
            value={currentSkill}
            onChangeText={setCurrentSkill}
            onSubmitEditing={addSkill}
          />
          <TouchableOpacity style={styles.addButton} onPress={addSkill}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillsList}>
          {formData.skills.map((skill, index) => (
            <TouchableOpacity
              key={index}
              style={styles.skillTag}
              onPress={() => removeSkill(skill)}
            >
              <Text style={styles.skillTagText}>{skill} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.qualificationsContainer}>
        <Text style={styles.label}>Qualifications/Certifications</Text>
        <View style={styles.skillsInput}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Add a qualification"
            value={currentQualification}
            onChangeText={setCurrentQualification}
            onSubmitEditing={addQualification}
          />
          <TouchableOpacity style={styles.addButton} onPress={addQualification}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillsList}>
          {formData.qualifications.map((qualification, index) => (
            <TouchableOpacity
              key={index}
              style={styles.skillTag}
              onPress={() => removeQualification(qualification)}
            >
              <Text style={styles.skillTagText}>{qualification} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.languagesContainer}>
        <Text style={styles.label}>Languages</Text>
        <View style={styles.skillsInput}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Add a language"
            value={currentLanguage}
            onChangeText={setCurrentLanguage}
            onSubmitEditing={addLanguage}
          />
          <TouchableOpacity style={styles.addButton} onPress={addLanguage}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillsList}>
          {formData.languages.map((language, index) => (
            <TouchableOpacity
              key={index}
              style={styles.skillTag}
              onPress={() => removeLanguage(language)}
            >
              <Text style={styles.skillTagText}>{language} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderJobPreferencesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Job Preferences</Text>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setShowJobTypesModal(true)}
      >
        <Text style={styles.modalButtonText}>
          Job Types ({formData.desired_job_types.length} selected) *
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setShowIndustriesModal(true)}
      >
        <Text style={styles.modalButtonText}>
          Industries ({formData.desired_industries.length} selected)
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfWidth]}
          placeholder="Min Salary (optional)"
          value={formData.desired_salary_min?.toString() || ''}
          onChangeText={value =>
            updateField('desired_salary_min', parseInt(value, 10) || undefined)
          }
          keyboardType="numeric"
        />

        <TextInput
          style={[styles.input, styles.halfWidth]}
          placeholder="Max Salary (optional)"
          value={formData.desired_salary_max?.toString() || ''}
          onChangeText={value =>
            updateField('desired_salary_max', parseInt(value, 10) || undefined)
          }
          keyboardType="numeric"
        />
      </View>

      <View style={styles.dropdown}>
        <Text style={styles.dropdownText}>{formData.availability}</Text>
      </View>
    </View>
  );

  const renderJewishCommunitySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Jewish Community Preferences</Text>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() =>
            updateField(
              'kosher_environment_preferred',
              !formData.kosher_environment_preferred,
            )
          }
        >
          <Text style={styles.checkboxText}>
            {formData.kosher_environment_preferred ? '☑️' : '☐'} Prefer kosher
            environment
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() =>
            updateField('shabbat_observant', !formData.shabbat_observant)
          }
        >
          <Text style={styles.checkboxText}>
            {formData.shabbat_observant ? '☑️' : '☐'} Shabbat observant
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() =>
            updateField(
              'jewish_organization_preferred',
              !formData.jewish_organization_preferred,
            )
          }
        >
          <Text style={styles.checkboxText}>
            {formData.jewish_organization_preferred ? '☑️' : '☐'} Prefer Jewish
            organizations
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDocumentsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Documents & Profile Image</Text>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Headshot (Circle Crop, ≤50MB)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() =>
            fileUploadService.showFilePickerAndUpload('image', url => {
              updateField('headshot_url', url);
            })
          }
        >
          <Text style={styles.uploadButtonIcon}>📷</Text>
          <Text style={styles.uploadButtonText}>
            {formData.headshot_url ? 'Change Headshot' : 'Upload Headshot'}
          </Text>
        </TouchableOpacity>
        {formData.headshot_url && (
          <Text style={styles.uploadSuccessText}>✅ Headshot uploaded</Text>
        )}
        <Text style={styles.uploadHintText}>
          Upload a professional headshot (will be cropped to circle, max 50MB)
        </Text>
      </View>

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Resume (PDF)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() =>
            fileUploadService.showFilePickerAndUpload('pdf', url => {
              updateField('resume_url', url);
            })
          }
        >
          <Text style={styles.uploadButtonIcon}>📄</Text>
          <Text style={styles.uploadButtonText}>
            {formData.resume_url ? 'Change Resume' : 'Upload Resume'}
          </Text>
        </TouchableOpacity>
        {formData.resume_url && (
          <Text style={styles.uploadSuccessText}>✅ Resume uploaded</Text>
        )}
        <Text style={styles.uploadHintText}>
          Upload your resume in PDF format (max 10MB)
        </Text>
      </View>
    </View>
  );

  const renderJobTypesModal = () => (
    <Modal visible={showJobTypesModal} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Job Types</Text>
          <FlatList
            data={JOB_TYPES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => toggleJobType(item)}
              >
                <Text style={styles.modalItemText}>
                  {formData.desired_job_types.includes(item) ? '☑️' : '☐'}{' '}
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowJobTypesModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderIndustriesModal = () => (
    <Modal
      visible={showIndustriesModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Industries</Text>
          <FlatList
            data={INDUSTRIES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => toggleIndustry(item)}
              >
                <Text style={styles.modalItemText}>
                  {formData.desired_industries.includes(item) ? '☑️' : '☐'}{' '}
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowIndustriesModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSubmitButton = () => (
    <View style={styles.submitContainer}>
      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {renderBasicInfoSection()}
          {renderEnhancedFieldsSection()}
          {renderContactSection()}
          {renderLocationSection()}
          {renderExperienceSection()}
          {renderJobPreferencesSection()}
          {renderJewishCommunitySection()}
          {renderDocumentsSection()}
          {renderSubmitButton()}
        </ScrollView>

        {renderJobTypesModal()}
        {renderIndustriesModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  title: {
    ...Typography.styles.h1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  input: {
    ...Typography.styles.body,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  checkboxRow: {
    marginBottom: Spacing.sm,
  },
  checkbox: {
    paddingVertical: Spacing.sm,
  },
  checkboxText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  skillsContainer: {
    marginBottom: Spacing.lg,
  },
  qualificationsContainer: {
    marginBottom: Spacing.lg,
  },
  languagesContainer: {
    marginBottom: Spacing.lg,
  },
  skillsInput: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  skillInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: Colors.primary.main,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.styles.h3,
    color: Colors.white,
    fontWeight: 'bold',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillTag: {
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  skillTagText: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dropdownText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
  },
  modalButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalButtonText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '90%',
    maxHeight: '80%',
    ...Shadows.lg,
  },
  modalTitle: {
    ...Typography.styles.h3,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalItemText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  modalCloseButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  modalCloseButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  submitContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  submitButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  uploadSection: {
    marginBottom: Spacing.lg,
  },
  uploadLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  uploadButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  uploadButtonIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  uploadButtonText: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadSuccessText: {
    ...Typography.styles.caption,
    color: Colors.success,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  uploadHintText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default JobSeekingScreen;

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from '../contexts/AuthContext';

interface JobFormData {
  // Basic Information
  title: string;
  description: string;
  company_name: string;

  // Enhanced Fields
  industry: string;
  job_type: string;
  compensation_structure: string;
  salary_rate: string;
  zip_code: string;
  contact_email: string;
  contact_phone: string;
  cta_link: string;

  // Location
  location_type: string;
  is_remote: boolean;
  city: string;
  state: string;
  address: string;

  // Additional Details
  compensation_type: string;
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency: string;
  compensation_display: string;
  category: string;
  tags: string[];
  requirements: string[];
  qualifications: string[];
  experience_level: string;
  benefits: string[];
  schedule: string;
  start_date: string;
  application_url: string;

  // Jewish Community Specific
  kosher_environment: boolean;
  shabbat_observant: boolean;
  jewish_organization: boolean;

  // Status
  is_urgent: boolean;
  expires_date: string;
}

const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Remote',
  'Hybrid',
  'Freelance',
  'Contract',
  'Seasonal',
  'Internship',
  'Volunteer',
];

const COMPENSATION_STRUCTURES = [
  'Salary',
  'Hourly',
  'Commission',
  'Stipend',
  'Volunteer',
  'Freelance',
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

const CreateJobScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<JobFormData>({
    // Basic Information
    title: '',
    description: '',
    company_name: '',

    // Enhanced Fields
    industry: '',
    job_type: 'Full-time',
    compensation_structure: 'Salary',
    salary_rate: '',
    zip_code: '',
    contact_email: '',
    contact_phone: '',
    cta_link: '',

    // Location
    location_type: 'on-site',
    is_remote: false,
    city: '',
    state: '',
    address: '',

    // Additional Details
    compensation_type: 'salary',
    compensation_min: undefined,
    compensation_max: undefined,
    compensation_currency: 'USD',
    compensation_display: '',
    category: '',
    tags: [],
    requirements: [],
    qualifications: [],
    experience_level: 'entry',
    benefits: [],
    schedule: '',
    start_date: '',
    application_url: '',

    // Jewish Community Specific
    kosher_environment: false,
    shabbat_observant: false,
    jewish_organization: false,

    // Status
    is_urgent: false,
    expires_date: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [currentQualification, setCurrentQualification] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [showJobTypesModal, setShowJobTypesModal] = useState(false);
  const [showIndustriesModal, setShowIndustriesModal] = useState(false);
  const [showCompensationModal, setShowCompensationModal] = useState(false);

  const updateField = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addRequirement = () => {
    if (
      currentRequirement.trim() &&
      !formData.requirements.includes(currentRequirement.trim())
    ) {
      updateField('requirements', [
        ...formData.requirements,
        currentRequirement.trim(),
      ]);
      setCurrentRequirement('');
    }
  };

  const removeRequirement = (requirement: string) => {
    updateField(
      'requirements',
      formData.requirements.filter(r => r !== requirement),
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

  const addBenefit = () => {
    if (
      currentBenefit.trim() &&
      !formData.benefits.includes(currentBenefit.trim())
    ) {
      updateField('benefits', [...formData.benefits, currentBenefit.trim()]);
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (benefit: string) => {
    updateField(
      'benefits',
      formData.benefits.filter(b => b !== benefit),
    );
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      updateField('tags', [...formData.tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateField(
      'tags',
      formData.tags.filter(t => t !== tag),
    );
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      { field: 'title', label: 'Job Title' },
      { field: 'description', label: 'Job Description' },
      { field: 'company_name', label: 'Company Name' },
      { field: 'industry', label: 'Industry' },
      { field: 'contact_email', label: 'Contact Email' },
    ];

    for (const { field, label } of requiredFields) {
      const value = formData[field as keyof JobFormData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        Alert.alert('Validation Error', `${label} is required`);
        return false;
      }
    }

    if (formData.description.length > 1000) {
      Alert.alert(
        'Validation Error',
        'Description must be 1000 characters or less',
      );
      return false;
    }

    if (!formData.is_remote && !formData.city) {
      Alert.alert('Validation Error', 'City is required for on-site positions');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to post a job');
      return;
    }

    setIsSubmitting(true);
    try {
      const jobData = {
        ...formData,
        poster_id: user.id,
        // Set auto-expire date to 2 weeks from now
        auto_expire_date: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      // TODO: Implement createJob method in ApiService
      const response = { success: true, data: { id: 'mock-job-id' } };

      if (response.success) {
        Alert.alert(
          'Success!',
          'Your job posting has been created successfully. It will be visible to job seekers for 2 weeks.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
        debugLog('✅ Job created:', response.data);
      } else {
        Alert.alert('Error', 'Failed to create job posting');
        errorLog('❌ Failed to create job:', 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create job posting. Please try again.');
      errorLog('❌ Error creating job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Post a Job</Text>
      <Text style={styles.subtitle}>
        Share your job opportunity with the Jewish community
      </Text>
    </View>
  );

  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Job Title *"
        value={formData.title}
        onChangeText={value => updateField('title', value)}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Company Name *"
        value={formData.company_name}
        onChangeText={value => updateField('company_name', value)}
        autoCapitalize="words"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Job Description * (up to 1000 characters)"
        value={formData.description}
        onChangeText={value => updateField('description', value)}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={1000}
      />
      <Text style={styles.characterCount}>
        {formData.description.length}/1000 characters
      </Text>
    </View>
  );

  const renderEnhancedFieldsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Job Details</Text>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setShowIndustriesModal(true)}
      >
        <Text style={styles.modalButtonText}>
          Industry: {formData.industry || 'Select Industry *'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setShowJobTypesModal(true)}
      >
        <Text style={styles.modalButtonText}>
          Job Type: {formData.job_type}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setShowCompensationModal(true)}
      >
        <Text style={styles.modalButtonText}>
          Compensation Structure: {formData.compensation_structure}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Salary/Rate (e.g., $50K-$70K, $25/hour)"
        value={formData.salary_rate}
        onChangeText={value => updateField('salary_rate', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Zip Code *"
        value={formData.zip_code}
        onChangeText={value => updateField('zip_code', value)}
        keyboardType="numeric"
      />
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Contact Email *"
        value={formData.contact_email}
        onChangeText={value => updateField('contact_email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contact Phone"
        value={formData.contact_phone}
        onChangeText={value => updateField('contact_phone', value)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Application/CTA Link"
        value={formData.cta_link}
        onChangeText={value => updateField('cta_link', value)}
        keyboardType="url"
        autoCapitalize="none"
      />
    </View>
  );

  const renderLocationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location & Work Type</Text>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateField('is_remote', !formData.is_remote)}
        >
          <Text style={styles.checkboxText}>
            {formData.is_remote ? '☑️' : '☐'} Remote position
          </Text>
        </TouchableOpacity>
      </View>

      {!formData.is_remote && (
        <>
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
            placeholder="Address"
            value={formData.address}
            onChangeText={value => updateField('address', value)}
            autoCapitalize="words"
          />
        </>
      )}
    </View>
  );

  const renderRequirementsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Requirements & Qualifications</Text>

      <View style={styles.skillsContainer}>
        <Text style={styles.label}>Requirements</Text>
        <View style={styles.skillsInput}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Add a requirement"
            value={currentRequirement}
            onChangeText={setCurrentRequirement}
            onSubmitEditing={addRequirement}
          />
          <TouchableOpacity style={styles.addButton} onPress={addRequirement}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillsList}>
          {formData.requirements.map((requirement, index) => (
            <TouchableOpacity
              key={index}
              style={styles.skillTag}
              onPress={() => removeRequirement(requirement)}
            >
              <Text style={styles.skillTagText}>{requirement} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.qualificationsContainer}>
        <Text style={styles.label}>Qualifications</Text>
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
    </View>
  );

  const renderBenefitsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Benefits & Additional Info</Text>

      <View style={styles.benefitsContainer}>
        <Text style={styles.label}>Benefits</Text>
        <View style={styles.skillsInput}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Add a benefit"
            value={currentBenefit}
            onChangeText={setCurrentBenefit}
            onSubmitEditing={addBenefit}
          />
          <TouchableOpacity style={styles.addButton} onPress={addBenefit}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillsList}>
          {formData.benefits.map((benefit, index) => (
            <TouchableOpacity
              key={index}
              style={styles.skillTag}
              onPress={() => removeBenefit(benefit)}
            >
              <Text style={styles.skillTagText}>{benefit} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Schedule (e.g., Monday-Friday 9am-5pm)"
        value={formData.schedule}
        onChangeText={value => updateField('schedule', value)}
      />

      <TextInput
        style={styles.input}
        placeholder="Start Date (optional)"
        value={formData.start_date}
        onChangeText={value => updateField('start_date', value)}
      />
    </View>
  );

  const renderJewishCommunitySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Jewish Community Preferences</Text>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() =>
            updateField('kosher_environment', !formData.kosher_environment)
          }
        >
          <Text style={styles.checkboxText}>
            {formData.kosher_environment ? '☑️' : '☐'} Kosher environment
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
            workplace
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() =>
            updateField('jewish_organization', !formData.jewish_organization)
          }
        >
          <Text style={styles.checkboxText}>
            {formData.jewish_organization ? '☑️' : '☐'} Jewish organization
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateField('is_urgent', !formData.is_urgent)}
        >
          <Text style={styles.checkboxText}>
            {formData.is_urgent ? '☑️' : '☐'} Urgent hiring
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModals = () => (
    <>
      {/* Job Types Modal */}
      <Modal
        visible={showJobTypesModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Job Type</Text>
            <FlatList
              data={JOB_TYPES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('job_type', item);
                    setShowJobTypesModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowJobTypesModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Industries Modal */}
      <Modal
        visible={showIndustriesModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Industry</Text>
            <FlatList
              data={INDUSTRIES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('industry', item);
                    setShowIndustriesModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowIndustriesModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Compensation Structure Modal */}
      <Modal
        visible={showCompensationModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Compensation Structure</Text>
            <FlatList
              data={COMPENSATION_STRUCTURES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('compensation_structure', item);
                    setShowCompensationModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCompensationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
          {isSubmitting ? 'Creating Job Post...' : 'Post Job'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.submitNote}>
        Your job will be active for 2 weeks. You can repost or mark as filled
        anytime.
      </Text>
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
          {renderRequirementsSection()}
          {renderBenefitsSection()}
          {renderJewishCommunitySection()}
          {renderSubmitButton()}
        </ScrollView>

        {renderModals()}
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
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: -Spacing.md,
    marginBottom: Spacing.md,
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
  benefitsContainer: {
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
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  modalCloseButtonText: {
    ...Typography.styles.button,
    color: Colors.textSecondary,
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
  submitNote: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});

export default CreateJobScreen;

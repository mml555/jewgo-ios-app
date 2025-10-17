import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import JobsService, {
  Industry,
  JobType,
  CompensationStructure,
  ExperienceLevel,
} from '../../services/JobsService';
import { Spacing } from '../../styles/designSystem';

type RouteParams = {
  CreateJob: {
    jobId?: string;
    mode?: 'create' | 'edit';
  };
};

const CreateJobScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CreateJob'>>();
  const insets = useSafeAreaInsets();
  const { jobId, mode = 'create' } = route.params || {};

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Lookup data
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [compensationStructures, setCompensationStructures] = useState<
    CompensationStructure[]
  >([]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    jobTitle: '',
    companyName: '',
    industryId: '',
    jobTypeId: '',
    experienceLevelId: '',

    // Step 2: Compensation & Location
    compensationStructureId: '',
    salaryMin: '',
    salaryMax: '',
    hourlyRateMin: '',
    hourlyRateMax: '',
    showSalary: true,
    zipCode: '',
    isRemote: false,
    isHybrid: false,

    // Step 3: Job Details
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    skills: [] as string[],
    contactEmail: '',
    contactPhone: '',
    ctaLink: '',
  });

  // Skills input
  const [skillInput, setSkillInput] = useState('');

  const loadLookupData = useCallback(async () => {
    try {
      console.log('🔄 Loading lookup data from API...');
      const [industriesRes, jobTypesRes, compensationRes, experienceRes] =
        await Promise.all([
          JobsService.getIndustries(),
          JobsService.getJobTypes(),
          JobsService.getCompensationStructures(),
          JobsService.getExperienceLevels(),
        ]);

      console.log('✅ Lookup data loaded:', {
        industries: industriesRes.industries?.length,
        jobTypes: jobTypesRes.jobTypes?.length,
        compensationStructures: compensationRes.compensationStructures?.length,
        experienceLevels: experienceRes.experienceLevels?.length,
      });

      setIndustries(industriesRes.industries);
      setJobTypes(jobTypesRes.jobTypes);
      setCompensationStructures(compensationRes.compensationStructures);
      setExperienceLevels(experienceRes.experienceLevels);
    } catch (error) {
      console.error('❌ Error loading lookup data:', error);
      Alert.alert(
        'Error Loading Form',
        'Failed to load form data from server. Please check your connection and try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  }, [navigation]);

  const loadJobForEdit = useCallback(async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const response = await JobsService.getJobById(jobId);
      const job = response.jobListing;

      setFormData({
        jobTitle: job.job_title,
        companyName: job.company_name || '',
        industryId: job.industry_id,
        jobTypeId: job.job_type_id,
        experienceLevelId: job.experience_level_id || '',
        compensationStructureId: job.compensation_structure_id,
        salaryMin: job.salary_min ? String(job.salary_min / 100) : '',
        salaryMax: job.salary_max ? String(job.salary_max / 100) : '',
        hourlyRateMin: job.hourly_rate_min
          ? String(job.hourly_rate_min / 100)
          : '',
        hourlyRateMax: job.hourly_rate_max
          ? String(job.hourly_rate_max / 100)
          : '',
        showSalary: job.show_salary,
        zipCode: job.zip_code,
        isRemote: job.is_remote,
        isHybrid: job.is_hybrid,
        description: job.description,
        requirements: Array.isArray(job.requirements)
          ? job.requirements.join(', ')
          : job.requirements || '',
        responsibilities: job.responsibilities || '',
        benefits: Array.isArray(job.benefits)
          ? job.benefits.join(', ')
          : job.benefits || '',
        skills: job.skills || [],
        contactEmail: job.contact_email || '',
        contactPhone: job.contact_phone || '',
        ctaLink: job.cta_link || '',
      });
    } catch (error) {
      console.error('Error loading job for edit:', error);
      Alert.alert('Error', 'Failed to load job data');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Load lookup data and job data on mount
  useEffect(() => {
    loadLookupData();
    if (mode === 'edit' && jobId) {
      loadJobForEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  const updateFormData = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      if (!formData.skills.includes(skillInput.trim())) {
        updateFormData('skills', [...formData.skills, skillInput.trim()]);
        setSkillInput('');
      } else {
        Alert.alert('Duplicate', 'This skill is already added');
      }
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = [...formData.skills];
    newSkills.splice(index, 1);
    updateFormData('skills', newSkills);
  };

  const validateStep1 = () => {
    if (!formData.jobTitle.trim()) {
      Alert.alert('Required', 'Please enter a job title');
      return false;
    }
    if (!formData.industryId) {
      Alert.alert('Required', 'Please select an industry');
      return false;
    }
    if (!formData.jobTypeId) {
      Alert.alert('Required', 'Please select a job type');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.compensationStructureId) {
      Alert.alert('Required', 'Please select a compensation structure');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Required', 'Please enter a zip code');
      return false;
    }

    // Validate salary range
    const salMin = parseFloat(formData.salaryMin);
    const salMax = parseFloat(formData.salaryMax);
    if (salMin && salMax && salMax < salMin) {
      Alert.alert(
        'Invalid',
        'Maximum salary must be greater than minimum salary',
      );
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    if (!formData.description.trim() || formData.description.length < 100) {
      Alert.alert(
        'Required',
        'Please enter a job description (minimum 100 characters)',
      );
      return false;
    }
    if (!formData.contactEmail.trim()) {
      Alert.alert('Required', 'Please enter a contact email');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      Alert.alert('Invalid', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

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
    if (!validateStep3()) return;

    try {
      setSubmitting(true);

      const submitData = {
        jobTitle: formData.jobTitle,
        companyName: formData.companyName || undefined,
        industryId: formData.industryId,
        jobTypeId: formData.jobTypeId,
        experienceLevelId: formData.experienceLevelId || undefined,
        compensationStructureId: formData.compensationStructureId,
        salaryMin: formData.salaryMin
          ? parseFloat(formData.salaryMin) * 100
          : undefined,
        salaryMax: formData.salaryMax
          ? parseFloat(formData.salaryMax) * 100
          : undefined,
        hourlyRateMin: formData.hourlyRateMin
          ? parseFloat(formData.hourlyRateMin) * 100
          : undefined,
        hourlyRateMax: formData.hourlyRateMax
          ? parseFloat(formData.hourlyRateMax) * 100
          : undefined,
        showSalary: formData.showSalary,
        zipCode: formData.zipCode,
        isRemote: formData.isRemote,
        isHybrid: formData.isHybrid,
        description: formData.description,
        requirements: formData.requirements || undefined,
        responsibilities: formData.responsibilities || undefined,
        benefits: formData.benefits || undefined,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        ctaLink: formData.ctaLink || undefined,
      };

      if (mode === 'edit' && jobId) {
        await JobsService.updateJobListing(jobId, submitData);
        Alert.alert('Success', 'Job listing updated successfully!');
      } else {
        await JobsService.createJobListing(submitData);
        Alert.alert('Success', 'Job listing created successfully!');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save job listing');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map(step => (
        <View
          key={step}
          style={[
            styles.progressStep,
            step <= currentStep && styles.progressStepActive,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Job Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Senior Software Engineer"
          value={formData.jobTitle}
          onChangeText={text => updateFormData('jobTitle', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Acme Corp"
          value={formData.companyName}
          onChangeText={text => updateFormData('companyName', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Industry <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.industryId}
            onValueChange={value => updateFormData('industryId', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Industry" value="" />
            {industries.map(industry => (
              <Picker.Item
                key={industry.id}
                label={industry.name}
                value={industry.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Job Type <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.jobTypeId}
            onValueChange={value => updateFormData('jobTypeId', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Job Type" value="" />
            {jobTypes.map(jobType => (
              <Picker.Item
                key={jobType.id}
                label={jobType.name}
                value={jobType.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.experienceLevelId}
            onValueChange={value => updateFormData('experienceLevelId', value)}
            style={styles.picker}
          >
            <Picker.Item label="Not Specified" value="" />
            {experienceLevels.map(level => (
              <Picker.Item key={level.id} label={level.name} value={level.id} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => {
    const selectedCompensation = compensationStructures.find(
      cs => cs.id === formData.compensationStructureId,
    );
    const isHourly = selectedCompensation?.key.includes('hourly');
    const isSalary = selectedCompensation?.key.includes('salary');

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Compensation & Location</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Compensation Structure <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.compensationStructureId}
              onValueChange={value =>
                updateFormData('compensationStructureId', value)
              }
              style={styles.picker}
            >
              <Picker.Item label="Select Compensation Type" value="" />
              {compensationStructures.map(cs => (
                <Picker.Item key={cs.id} label={cs.name} value={cs.id} />
              ))}
            </Picker>
          </View>
        </View>

        {isSalary && (
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Min Salary ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="50000"
                value={formData.salaryMin}
                onChangeText={text =>
                  updateFormData('salaryMin', text.replace(/[^0-9]/g, ''))
                }
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Max Salary ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="80000"
                value={formData.salaryMax}
                onChangeText={text =>
                  updateFormData('salaryMax', text.replace(/[^0-9]/g, ''))
                }
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {isHourly && (
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Min Rate ($/hr)</Text>
              <TextInput
                style={styles.input}
                placeholder="20"
                value={formData.hourlyRateMin}
                onChangeText={text =>
                  updateFormData('hourlyRateMin', text.replace(/[^0-9]/g, ''))
                }
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Max Rate ($/hr)</Text>
              <TextInput
                style={styles.input}
                placeholder="35"
                value={formData.hourlyRateMax}
                onChangeText={text =>
                  updateFormData('hourlyRateMax', text.replace(/[^0-9]/g, ''))
                }
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => updateFormData('showSalary', !formData.showSalary)}
        >
          <View
            style={[
              styles.checkbox,
              formData.showSalary && styles.checkboxChecked,
            ]}
          >
            {formData.showSalary && <Text style={styles.checkboxIcon}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Show salary to applicants</Text>
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Zip Code <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="12345"
            value={formData.zipCode}
            onChangeText={text =>
              updateFormData('zipCode', text.replace(/[^0-9]/g, ''))
            }
            keyboardType="numeric"
            maxLength={5}
          />
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => updateFormData('isRemote', !formData.isRemote)}
        >
          <View
            style={[
              styles.checkbox,
              formData.isRemote && styles.checkboxChecked,
            ]}
          >
            {formData.isRemote && <Text style={styles.checkboxIcon}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Remote work available</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => updateFormData('isHybrid', !formData.isHybrid)}
        >
          <View
            style={[
              styles.checkbox,
              formData.isHybrid && styles.checkboxChecked,
            ]}
          >
            {formData.isHybrid && <Text style={styles.checkboxIcon}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Hybrid work available</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Job Details</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Job Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the role, responsibilities, and what makes this position great..."
          value={formData.description}
          onChangeText={text => updateFormData('description', text)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={2000}
        />
        <Text style={styles.charCount}>
          {formData.description.length}/2000 characters (min 100)
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Requirements</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Education, certifications, years of experience, etc."
          value={formData.requirements}
          onChangeText={text => updateFormData('requirements', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Responsibilities</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Day-to-day responsibilities..."
          value={formData.responsibilities}
          onChangeText={text => updateFormData('responsibilities', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Benefits</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Health insurance, PTO, 401k, etc."
          value={formData.benefits}
          onChangeText={text => updateFormData('benefits', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Required Skills</Text>
        <View style={styles.skillsInputContainer}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Add a skill"
            value={skillInput}
            onChangeText={setSkillInput}
            onSubmitEditing={addSkill}
          />
          <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
            <Text style={styles.addSkillButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.skillsContainer}>
          {formData.skills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
              <TouchableOpacity onPress={() => removeSkill(index)}>
                <Text style={styles.removeSkill}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Contact Email <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="jobs@company.com"
          value={formData.contactEmail}
          onChangeText={text => updateFormData('contactEmail', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 123-4567"
          value={formData.contactPhone}
          onChangeText={text => updateFormData('contactPhone', text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Application URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://company.com/apply"
          value={formData.ctaLink}
          onChangeText={text => updateFormData('ctaLink', text)}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#74E1A0" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>
          {mode === 'edit' ? 'Edit Job' : 'Create Job'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Step {currentStep} of {totalSteps}
        </Text>
        {renderProgressBar()}
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
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
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'edit' ? 'Update Job' : 'Create Job'}
              </Text>
            )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: '#292B2D',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: '#74E1A0',
    borderColor: '#74E1A0',
  },
  checkboxIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#292B2D',
  },
  skillsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillInput: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  addSkillButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  addSkillButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: 14,
    color: '#292B2D',
    marginRight: Spacing.xs,
  },
  removeSkill: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  backButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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

export default CreateJobScreen;

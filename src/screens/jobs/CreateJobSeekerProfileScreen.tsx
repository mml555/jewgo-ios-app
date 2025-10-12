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
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
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
    // Step 1: Personal Information
    name: '',
    age: '',
    gender: '',
    headshotUrl: '',
    zipCode: '',
    
    // Step 2: Professional Information
    preferredIndustryId: '',
    preferredJobTypeId: '',
    experienceLevelId: '',
    bio: '',
    skills: [] as string[],
    
    // Step 3: Compensation & Preferences
    desiredSalaryMin: '',
    desiredSalaryMax: '',
    availability: 'negotiable',
    willingToRelocate: false,
    willingToRemote: true,
    
    // Step 4: Contact & Links
    contactEmail: '',
    contactPhone: '',
    resumeUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    meetingLink: '',
  });

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    loadLookupData();
  }, []);

  const loadLookupData = async () => {
    try {
      console.log('🔄 Loading lookup data from API...');
      const [industriesRes, jobTypesRes, experienceRes] = await Promise.all([
        JobsService.getIndustries(),
        JobsService.getJobTypes(),
        JobsService.getExperienceLevels(),
      ]);
      console.log('✅ Lookup data loaded:', {
        industries: industriesRes.industries?.length,
        jobTypes: jobTypesRes.jobTypes?.length,
        experienceLevels: experienceRes.experienceLevels?.length
      });
      setIndustries(industriesRes.industries);
      setJobTypes(jobTypesRes.jobTypes);
      setExperienceLevels(experienceRes.experienceLevels);
    } catch (error) {
      console.error('❌ Error loading lookup data:', error);
      Alert.alert(
        'Error Loading Form',
        'Failed to load form data from server. Please check your connection and try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Required', 'Please enter your zip code');
      return false;
    }
    if (formData.zipCode.length < 5) {
      Alert.alert('Invalid', 'Zip code must be at least 5 digits');
      return false;
    }
    if (formData.age && (parseInt(formData.age) < 16 || parseInt(formData.age) > 100)) {
      Alert.alert('Invalid', 'Please enter a valid age (16-100)');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.contactEmail.trim()) {
      Alert.alert('Required', 'Please enter your contact email');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      Alert.alert('Invalid', 'Please enter a valid email address');
      return false;
    }

    // Validate phone format if provided
    if (formData.contactPhone && formData.contactPhone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid', 'Please enter a valid phone number (at least 10 digits)');
      return false;
    }

    // Validate URLs if provided
    const urlRegex = /^https?:\/\/.+\..+/;
    if (formData.resumeUrl && !urlRegex.test(formData.resumeUrl)) {
      Alert.alert('Invalid', 'Please enter a valid resume URL (starting with http:// or https://)');
      return false;
    }
    if (formData.linkedinUrl && !urlRegex.test(formData.linkedinUrl)) {
      Alert.alert('Invalid', 'Please enter a valid LinkedIn URL');
      return false;
    }
    if (formData.portfolioUrl && !urlRegex.test(formData.portfolioUrl)) {
      Alert.alert('Invalid', 'Please enter a valid portfolio URL');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    // Validate before moving to next step
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 4 && !validateStep4()) return;

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
    // Validate all required fields before submission
    if (!validateStep1()) return;
    if (!validateStep4()) return;

    // Additional salary validation
    const salMin = parseFloat(formData.desiredSalaryMin);
    const salMax = parseFloat(formData.desiredSalaryMax);
    if (salMin && salMax && salMax < salMin) {
      Alert.alert('Invalid', 'Maximum salary must be greater than minimum salary');
      return;
    }

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

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., John Doe"
          value={formData.name}
          onChangeText={(text) => updateFormData('name', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 25"
          value={formData.age}
          onChangeText={(text) => updateFormData('age', text)}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.gender}
            onValueChange={(value) => updateFormData('gender', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Non-binary" value="non_binary" />
            <Picker.Item label="Prefer not to say" value="prefer_not_to_say" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Zip Code <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 10001"
          value={formData.zipCode}
          onChangeText={(text) => updateFormData('zipCode', text)}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Headshot URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/photo.jpg"
          value={formData.headshotUrl}
          onChangeText={(text) => updateFormData('headshotUrl', text)}
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Professional Information</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Preferred Industry</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.preferredIndustryId}
            onValueChange={(value) => updateFormData('preferredIndustryId', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select industry" value="" />
            {industries.map((industry) => (
              <Picker.Item key={industry.id} label={industry.name} value={industry.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Preferred Job Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.preferredJobTypeId}
            onValueChange={(value) => updateFormData('preferredJobTypeId', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select job type" value="" />
            {jobTypes.map((jobType) => (
              <Picker.Item key={jobType.id} label={jobType.name} value={jobType.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.experienceLevelId}
            onValueChange={(value) => updateFormData('experienceLevelId', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select experience level" value="" />
            {experienceLevels.map((level) => (
              <Picker.Item key={level.id} label={level.name} value={level.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChangeText={(text) => updateFormData('bio', text)}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Skills</Text>
        <View style={styles.skillsInputContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Add a skill"
            value={skillInput}
            onChangeText={setSkillInput}
          />
          <TouchableOpacity style={styles.addButton} onPress={addSkill}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillsContainer}>
          {formData.skills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
              <TouchableOpacity onPress={() => removeSkill(index)}>
                <Text style={styles.removeSkillText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Compensation & Preferences</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Desired Salary Range (Annual)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Min (e.g., 50000)"
            value={formData.desiredSalaryMin}
            onChangeText={(text) => updateFormData('desiredSalaryMin', text)}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Max (e.g., 80000)"
            value={formData.desiredSalaryMax}
            onChangeText={(text) => updateFormData('desiredSalaryMax', text)}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Availability</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.availability}
            onValueChange={(value) => updateFormData('availability', value)}
            style={styles.picker}
          >
            <Picker.Item label="Immediate" value="immediate" />
            <Picker.Item label="2 Weeks" value="2-weeks" />
            <Picker.Item label="1 Month" value="1-month" />
            <Picker.Item label="Negotiable" value="negotiable" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Work Preferences</Text>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateFormData('willingToRemote', !formData.willingToRemote)}
        >
          <View style={[styles.checkboxBox, formData.willingToRemote && styles.checkboxBoxChecked]}>
            {formData.willingToRemote && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Open to remote work</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => updateFormData('willingToRelocate', !formData.willingToRelocate)}
        >
          <View style={[styles.checkboxBox, formData.willingToRelocate && styles.checkboxBoxChecked]}>
            {formData.willingToRelocate && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Willing to relocate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact & Links</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact Email <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          value={formData.contactEmail}
          onChangeText={(text) => updateFormData('contactEmail', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 (555) 123-4567"
          value={formData.contactPhone}
          onChangeText={(text) => updateFormData('contactPhone', text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Resume URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/resume.pdf"
          value={formData.resumeUrl}
          onChangeText={(text) => updateFormData('resumeUrl', text)}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>LinkedIn URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://linkedin.com/in/yourprofile"
          value={formData.linkedinUrl}
          onChangeText={(text) => updateFormData('linkedinUrl', text)}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Portfolio URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://yourportfolio.com"
          value={formData.portfolioUrl}
          onChangeText={(text) => updateFormData('portfolioUrl', text)}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Meeting Link (Zoom, Google Meet, etc.)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://zoom.us/j/..."
          value={formData.meetingLink}
          onChangeText={(text) => updateFormData('meetingLink', text)}
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
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
          {[1, 2, 3, 4].map((step) => (
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
        {renderCurrentStep()}
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
              <Text style={styles.submitButtonText}>Create Profile</Text>
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
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.lg,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    color: '#292B2D',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#292B2D',
  },
  skillsInputContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  skillText: {
    color: '#2E7D32',
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  removeSkillText: {
    color: '#2E7D32',
    fontSize: 20,
    fontWeight: 'bold',
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
    paddingVertical: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateJobSeekerProfileScreen;

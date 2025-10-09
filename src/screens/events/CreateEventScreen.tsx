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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import EventsService, {
  EventCategory,
  EventType,
} from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: new Date(),
    eventEndDate: new Date(),
    zipCode: '',
    address: '',
    venueName: '',
    flyerUrl: '',
    flyerWidth: 0,
    flyerHeight: 0,
    categoryId: '',
    eventTypeId: '',
    host: '',
    contactEmail: '',
    contactPhone: '',
    ctaLink: '',
    capacity: '',
    isRsvpRequired: false,
    isSponsorshipAvailable: false,
    isNonprofit: false,
  });

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadLookupData();
  }, []);

  const loadLookupData = async () => {
    try {
      const [categoriesRes, typesRes] = await Promise.all([
        EventsService.getCategories(),
        EventsService.getEventTypes(),
      ]);
      setCategories(categoriesRes.categories);
      setEventTypes(typesRes.eventTypes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load form data');
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleFlyerUpload = async () => {
    Alert.alert(
      'Info',
      'Flyer upload with 8.5x11" validation - Use image picker library',
    );
    // Implementation: Use react-native-image-picker with aspect ratio validation
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const response = await EventsService.createEvent({
        title: formData.title,
        description: formData.description,
        eventDate: formData.eventDate.toISOString(),
        eventEndDate: formData.eventEndDate.toISOString(),
        zipCode: formData.zipCode,
        address: formData.address || undefined,
        venueName: formData.venueName || undefined,
        flyerUrl: formData.flyerUrl,
        flyerWidth: formData.flyerWidth,
        flyerHeight: formData.flyerHeight,
        categoryId: formData.categoryId,
        eventTypeId: formData.eventTypeId,
        host: formData.host || undefined,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        ctaLink: formData.ctaLink || undefined,
        capacity: formData.capacity
          ? parseInt(formData.capacity, 10)
          : undefined,
        isRsvpRequired: formData.isRsvpRequired,
        isSponsorshipAvailable: formData.isSponsorshipAvailable,
        isNonprofit: formData.isNonprofit,
      });

      if (response.isPaid && response.paymentIntent) {
        Alert.alert(
          'Payment Required',
          'This event costs $9.99. Redirecting to payment...',
        );
        // Navigate to payment screen
      } else {
        Alert.alert('Success', 'Event created successfully!');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event');
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
        <Text style={styles.headerTitle}>Create Event</Text>
        <Text style={styles.headerSubtitle}>
          Step {currentStep} of {totalSteps}
        </Text>

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
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={text => updateFormData('title', text)}
                placeholder="e.g., Shabbat Dinner"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={text => updateFormData('description', text)}
                multiline
                numberOfLines={6}
                placeholder="Describe your event..."
              />
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                📅 {formData.eventDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.eventDate}
                mode="datetime"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) updateFormData('eventDate', date);
                }}
              />
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Location & Flyer</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Zip Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.zipCode}
                onChangeText={text => updateFormData('zipCode', text)}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleFlyerUpload}
            >
              <Text style={styles.uploadButtonText}>
                {formData.flyerUrl
                  ? '✓ Flyer Uploaded'
                  : '📤 Upload Flyer (8.5x11")'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.contactEmail}
                onChangeText={text => updateFormData('contactEmail', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                updateFormData('isNonprofit', !formData.isNonprofit)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.isNonprofit && styles.checkboxChecked,
                ]}
              >
                {formData.isNonprofit && (
                  <Text style={styles.checkboxIcon}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                This is a nonprofit event (Free)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            currentStep > 1
              ? setCurrentStep(currentStep - 1)
              : navigation.goBack()
          }
        >
          <Text style={styles.backButtonText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setCurrentStep(currentStep + 1)}
          >
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
            <Text style={styles.submitButtonText}>Create Event</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
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
  headerSubtitle: { fontSize: 16, color: '#666', marginBottom: Spacing.md },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: { backgroundColor: '#74E1A0' },
  content: { flex: 1 },
  stepContainer: { padding: Spacing.lg },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.lg,
  },
  formGroup: { marginBottom: Spacing.lg },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: { fontSize: 16, color: '#292B2D' },
  uploadButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  uploadButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
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
  checkboxChecked: { backgroundColor: '#74E1A0', borderColor: '#74E1A0' },
  checkboxIcon: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16, color: '#292B2D' },
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
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#292B2D' },
  nextButton: {
    flex: 1,
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  submitButton: {
    flex: 1,
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

export default CreateEventScreen;

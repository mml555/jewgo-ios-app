import React, { useState } from 'react';
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
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import ClaimsService from '../../services/ClaimsService';
import { Spacing } from '../../styles/designSystem';

type RouteParams = {
  ClaimListing: {
    entityId: string;
    entityType: string;
    entityName: string;
  };
};

const ClaimListingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ClaimListing'>>();
  const insets = useSafeAreaInsets();
  const { entityId, entityType, entityName } = route.params;

  const [formData, setFormData] = useState({
    claimantName: '',
    claimantPhone: '',
    claimantEmail: '',
    claimantNotes: '',
    claimantRole: '',
    businessName: '',
    businessTaxId: '',
    businessLicenseNumber: '',
    yearsAtBusiness: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const updateFormData = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async () => {
    if (
      !formData.claimantName.trim() ||
      !formData.claimantPhone.trim() ||
      !formData.claimantEmail.trim()
    ) {
      Alert.alert('Required', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const response = await ClaimsService.submitClaim(entityId, entityType, {
        claimantName: formData.claimantName,
        claimantPhone: formData.claimantPhone,
        claimantEmail: formData.claimantEmail,
        claimantNotes: formData.claimantNotes || undefined,
        claimantRole: formData.claimantRole || undefined,
        businessName: formData.businessName || undefined,
        businessTaxId: formData.businessTaxId || undefined,
        businessLicenseNumber: formData.businessLicenseNumber || undefined,
        yearsAtBusiness: formData.yearsAtBusiness
          ? parseInt(formData.yearsAtBusiness, 10)
          : undefined,
      });

      Alert.alert('Success', response.message);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit claim');
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
        <Text style={styles.headerTitle}>Claim {entityName}</Text>
        <Text style={styles.headerSubtitle}>
          Provide your information to verify ownership
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Your Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.claimantName}
            onChangeText={text => updateFormData('claimantName', text)}
            placeholder="John Doe"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.claimantPhone}
            onChangeText={text => updateFormData('claimantPhone', text)}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.claimantEmail}
            onChangeText={text => updateFormData('claimantEmail', text)}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Your Role</Text>
          <TextInput
            style={styles.input}
            value={formData.claimantRole}
            onChangeText={text => updateFormData('claimantRole', text)}
            placeholder="e.g., Owner, Manager, Rabbi"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            value={formData.businessName}
            onChangeText={text => updateFormData('businessName', text)}
            placeholder="Official business name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Business Tax ID (EIN)</Text>
          <TextInput
            style={styles.input}
            value={formData.businessTaxId}
            onChangeText={text => updateFormData('businessTaxId', text)}
            placeholder="XX-XXXXXXX"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Business License Number</Text>
          <TextInput
            style={styles.input}
            value={formData.businessLicenseNumber}
            onChangeText={text => updateFormData('businessLicenseNumber', text)}
            placeholder="License #"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.claimantNotes}
            onChangeText={text => updateFormData('claimantNotes', text)}
            placeholder="Any additional information to support your claim..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📋 Your claim will be reviewed by our team. You'll be notified once
            a decision is made.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
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
            <Text style={styles.submitButtonText}>Submit Claim</Text>
          )}
        </TouchableOpacity>
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
  headerSubtitle: { fontSize: 16, color: '#666' },
  content: { flex: 1, padding: Spacing.lg },
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: { fontSize: 14, color: '#1976D2', lineHeight: 20 },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});

export default ClaimListingScreen;

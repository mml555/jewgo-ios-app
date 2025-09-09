import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';

interface BasicInfoPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const BasicInfoPage: React.FC<BasicInfoPageProps> = ({
  formData,
  onFormDataChange,
  category,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    { key: 'mikvah', label: 'Mikvah', emoji: '🛁' },
    { key: 'eatery', label: 'Eatery', emoji: '🍽️' },
    { key: 'shul', label: 'Shul', emoji: '🕍' },
    { key: 'stores', label: 'Stores', emoji: '🏪' },
    { key: 'shuk', label: 'Shuk', emoji: '🥬' },
    { key: 'shtetl', label: 'Shtetl', emoji: '🏘️' },
    { key: 'shidduch', label: 'Shidduch', emoji: '💕' },
    { key: 'social', label: 'Social', emoji: '👥' },
  ];

  const handleInputChange = useCallback((field: keyof ListingFormData, value: string) => {
    onFormDataChange({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onFormDataChange, errors]);

  const handleCategorySelect = useCallback((categoryKey: string) => {
    onFormDataChange({ category: categoryKey });
  }, [onFormDataChange]);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Business name must be at least 2 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      // Form is valid, parent will handle navigation
      return true;
    } else {
      Alert.alert('Please fix the errors', 'Please fill in all required fields correctly.');
      return false;
    }
  }, [validateForm]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeEmoji}>🎉</Text>
        <Text style={styles.welcomeTitle}>Let's add your {category.toLowerCase()}!</Text>
        <Text style={styles.welcomeSubtitle}>
          Help the community discover your amazing place
        </Text>
      </View>

      {/* Business Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Name *</Text>
        <TextInput
          style={[styles.textInput, errors.name && styles.textInputError]}
          placeholder="Enter your business name"
          placeholderTextColor="#8E8E93"
          value={formData.name}
          onChangeText={(text) => handleInputChange('name', text)}
          maxLength={100}
          accessible={true}
          accessibilityLabel="Business name input"
          accessibilityHint="Enter the name of your business"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        <Text style={styles.helpText}>
          This will be the main title shown on your listing card
        </Text>
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category *</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                formData.category === cat.key && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategorySelect(cat.key)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select ${cat.label} category`}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoryLabel,
                formData.category === cat.key && styles.categoryLabelActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.textInputError]}
          placeholder="Tell us about your business..."
          placeholderTextColor="#8E8E93"
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
          accessible={true}
          accessibilityLabel="Business description input"
          accessibilityHint="Enter a description of your business"
        />
        <Text style={styles.characterCount}>
          {formData.description.length}/500 characters
        </Text>
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        <Text style={styles.helpText}>
          Describe what makes your place special and what services you offer
        </Text>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Use a clear, memorable business name
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Be specific about what you offer
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Mention any unique features or specialties
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 100,
  },
  textInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    lineHeight: 18,
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: '#74e1a0',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BasicInfoPage;

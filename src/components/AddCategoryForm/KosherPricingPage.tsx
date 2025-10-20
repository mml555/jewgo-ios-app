import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../../styles/designSystem';
import { hapticButtonPress } from '../../utils/hapticFeedback';

interface KosherPricingPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const KosherPricingPage: React.FC<KosherPricingPageProps> = memo(
  ({ formData, onFormDataChange }) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleInputChange = useCallback(
      (field: keyof ListingFormData, value: string | string[]) => {
        onFormDataChange({ [field]: value });
        if (errors[field]) {
          setErrors(prev => ({ ...prev, [field]: '' }));
        }
      },
      [onFormDataChange, errors],
    );

    const handleDietaryCategorySelect = useCallback(
      (category: 'Meat' | 'Dairy' | 'Pareve') => {
        hapticButtonPress();
        handleInputChange('dietary_category', category);
      },
      [handleInputChange],
    );

    const handleKosherTagToggle = useCallback(
      (tag: string) => {
        hapticButtonPress();
        const currentTags = formData.kosher_tags || [];
        const newTags = currentTags.includes(tag)
          ? currentTags.filter(t => t !== tag)
          : [...currentTags, tag];
        handleInputChange('kosher_tags', newTags);
      },
      [formData.kosher_tags, handleInputChange],
    );

    const handlePriceRangeSelect = useCallback(
      (range: string) => {
        hapticButtonPress();
        handleInputChange('price_range', range as any);
      },
      [handleInputChange],
    );

    const dietaryCategories = [
      { value: 'Meat', label: 'Meat', icon: '🥩' },
      { value: 'Dairy', label: 'Dairy', icon: '🥛' },
      { value: 'Pareve', label: 'Pareve', icon: '🥬' },
    ];

    const kosherTags = [
      'Cholov Yisroel',
      'Pas Yisroel',
      'Glatt Kosher',
      'Chalav Yisroel',
      'Yoshon',
      'Chodosh',
    ];

    const priceRanges = ['$5-10', '$10-20', '$20-30', '$30-40', '$40+'];

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContent}>
          {/* Dietary Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Dietary Category *</Text>
            <View style={styles.pillRow}>
              {dietaryCategories.map(category => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryPill,
                    formData.dietary_category === category.value &&
                      styles.pillActive,
                  ]}
                  onPress={() =>
                    handleDietaryCategorySelect(category.value as any)
                  }
                >
                  <Text style={styles.pillIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.pillText,
                      formData.dietary_category === category.value &&
                        styles.pillTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Kosher Tags */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Kosher Tags *</Text>
            <View style={styles.tagsGrid}>
              {kosherTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagPill,
                    formData.kosher_tags?.includes(tag) && styles.pillActive,
                  ]}
                  onPress={() => handleKosherTagToggle(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      formData.kosher_tags?.includes(tag) &&
                        styles.pillTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Hechsher */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Certifying Agency (Hechsher) *</Text>
            <TextInput
              style={styles.input}
              value={formData.hechsher}
              onChangeText={value => handleInputChange('hechsher', value)}
              placeholder="e.g., OU, Star-K, Kof-K"
              placeholderTextColor="#999999"
            />
          </View>

          {/* Short Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Short Description * ({formData.short_description?.length || 0}/70)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.short_description}
              onChangeText={value =>
                handleInputChange('short_description', value)
              }
              placeholder="Brief description of your business (max 70 characters)"
              placeholderTextColor="#999999"
              multiline
              maxLength={70}
              numberOfLines={3}
            />
          </View>

          {/* Price Range */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Price Range *</Text>
            <View style={styles.priceRow}>
              {priceRanges.map(range => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.pricePill,
                    formData.price_range === range && styles.pillActive,
                  ]}
                  onPress={() => handlePriceRangeSelect(range)}
                >
                  <Text
                    style={[
                      styles.priceText,
                      formData.price_range === range && styles.pillTextActive,
                    ]}
                  >
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.jetBlack,
    marginBottom: 8,
    fontFamily: 'Nunito-SemiBold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#292B2D',
    fontFamily: 'Nunito',
    borderWidth: 2,
    borderColor: '#C6FFD1',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#C6FFD1',
  },
  pillActive: {
    backgroundColor: '#C6FFD1',
    borderColor: '#C6FFD1',
  },
  pillIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  pillText: {
    fontSize: 14,
    color: '#292B2D',
    fontFamily: 'Nunito',
  },
  pillTextActive: {
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    color: '#292B2D',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#C6FFD1',
  },
  tagText: {
    fontSize: 13,
    color: '#292B2D',
    fontFamily: 'Nunito',
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pricePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#C6FFD1',
  },
  priceText: {
    fontSize: 14,
    color: '#292B2D',
    fontFamily: 'Nunito',
  },
});

KosherPricingPage.displayName = 'KosherPricingPage';

export default KosherPricingPage;

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

interface KosherPricingPageProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  category: string;
}

const KosherPricingPage: React.FC<KosherPricingPageProps> = ({
  formData,
  onFormDataChange,
  category,
}) => {
  const kosherLevels = [
    { key: 'regular', label: 'Regular Kosher', description: 'Standard kosher certification', emoji: '✅' },
    { key: 'glatt', label: 'Glatt Kosher', description: 'Glatt kosher certification', emoji: '🥩' },
    { key: 'chalav-yisrael', label: 'Chalav Yisrael', description: 'Chalav Yisrael dairy products', emoji: '🥛' },
    { key: 'pas-yisrael', label: 'Pas Yisrael', description: 'Pas Yisrael bread products', emoji: '🍞' },
    { key: 'not-kosher', label: 'Not Kosher', description: 'No kosher certification', emoji: '❌' },
  ];

  const priceRanges = [
    { key: '$', label: '$', description: 'Budget-friendly', emoji: '💰' },
    { key: '$$', label: '$$', description: 'Moderate pricing', emoji: '💵' },
    { key: '$$$', label: '$$$', description: 'Upscale pricing', emoji: '💎' },
    { key: '$$$$', label: '$$$$', description: 'Premium pricing', emoji: '👑' },
  ];

  const specialFeatures = [
    { key: 'family-friendly', label: 'Family Friendly', emoji: '👨‍👩‍👧‍👦' },
    { key: 'date-night', label: 'Date Night Spot', emoji: '💕' },
    { key: 'business-meetings', label: 'Business Meetings', emoji: '💼' },
    { key: 'group-events', label: 'Group Events', emoji: '🎉' },
    { key: 'outdoor-dining', label: 'Outdoor Dining', emoji: '🌳' },
    { key: 'live-music', label: 'Live Music', emoji: '🎵' },
    { key: 'happy-hour', label: 'Happy Hour', emoji: '🍻' },
    { key: 'late-night', label: 'Late Night', emoji: '🌙' },
    { key: 'brunch', label: 'Brunch', emoji: '🥞' },
    { key: 'desserts', label: 'Desserts', emoji: '🍰' },
    { key: 'coffee', label: 'Coffee & Tea', emoji: '☕' },
    { key: 'catering', label: 'Catering', emoji: '🍽️' },
  ];

  const handleKosherLevelSelect = useCallback((level: string) => {
    onFormDataChange({ kosherLevel: level });
  }, [onFormDataChange]);

  const handlePriceRangeSelect = useCallback((range: string) => {
    onFormDataChange({ priceRange: range });
  }, [onFormDataChange]);

  const handleSpecialFeatureToggle = useCallback((feature: string) => {
    const currentFeatures = formData.specialFeatures || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f: string) => f !== feature)
      : [...currentFeatures, feature];
    
    onFormDataChange({ specialFeatures: newFeatures });
  }, [formData.specialFeatures, onFormDataChange]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerEmoji}>🥘</Text>
        <Text style={styles.headerTitle}>Kosher & Pricing</Text>
        <Text style={styles.headerSubtitle}>
          Set your kosher level and pricing information
        </Text>
      </View>

      {/* Kosher Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kosher Level *</Text>
        <Text style={styles.sectionSubtitle}>
          Select the appropriate kosher certification level
        </Text>
        
        <View style={styles.kosherGrid}>
          {kosherLevels.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.kosherButton,
                formData.kosherLevel === level.key && styles.kosherButtonActive,
              ]}
              onPress={() => handleKosherLevelSelect(level.key)}
            >
              <Text style={styles.kosherEmoji}>{level.emoji}</Text>
              <Text style={[
                styles.kosherLabel,
                formData.kosherLevel === level.key && styles.kosherLabelActive,
              ]}>
                {level.label}
              </Text>
              <Text style={[
                styles.kosherDescription,
                formData.kosherLevel === level.key && styles.kosherDescriptionActive,
              ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Range *</Text>
        <Text style={styles.sectionSubtitle}>
          Select the general price range for your services
        </Text>
        
        <View style={styles.priceGrid}>
          {priceRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.priceButton,
                formData.priceRange === range.key && styles.priceButtonActive,
              ]}
              onPress={() => handlePriceRangeSelect(range.key)}
            >
              <Text style={styles.priceEmoji}>{range.emoji}</Text>
              <Text style={[
                styles.priceLabel,
                formData.priceRange === range.key && styles.priceLabelActive,
              ]}>
                {range.label}
              </Text>
              <Text style={[
                styles.priceDescription,
                formData.priceRange === range.key && styles.priceDescriptionActive,
              ]}>
                {range.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Special Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Features</Text>
        <Text style={styles.sectionSubtitle}>
          Select features that make your place special (optional)
        </Text>
        
        <View style={styles.featuresGrid}>
          {specialFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.key}
              style={[
                styles.featureButton,
                formData.specialFeatures?.includes(feature.key) && styles.featureButtonActive,
              ]}
              onPress={() => handleSpecialFeatureToggle(feature.key)}
            >
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <Text style={[
                styles.featureLabel,
                formData.specialFeatures?.includes(feature.key) && styles.featureLabelActive,
              ]}>
                {feature.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Kosher & Pricing Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Be accurate about your kosher certification level
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Choose a price range that reflects your typical prices
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Highlight unique features that set you apart
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  kosherGrid: {
    gap: 12,
  },
  kosherButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  kosherButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  kosherEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  kosherLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  kosherLabelActive: {
    color: '#FFFFFF',
  },
  kosherDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  kosherDescriptionActive: {
    color: '#FFFFFF',
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priceButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  priceButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  priceEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  priceLabelActive: {
    color: '#FFFFFF',
  },
  priceDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  priceDescriptionActive: {
    color: '#FFFFFF',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  featureButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  featureEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  featureLabelActive: {
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

export default KosherPricingPage;

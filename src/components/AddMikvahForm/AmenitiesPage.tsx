import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../../styles/designSystem';
import { hapticButtonPress } from '../../utils/hapticFeedback';

export interface MikvahFormData {
  // Amenities
  has_parking: boolean;
  has_accessibility: boolean;
  has_private_rooms: boolean;
  has_heating: boolean;
  has_air_conditioning: boolean;
  has_wifi: boolean;

  // Pricing
  price_per_use?: number;
  currency: string;
  accepts_cash: boolean;
  accepts_credit: boolean;
  accepts_checks: boolean;
}

interface AmenitiesPageProps {
  formData: MikvahFormData;
  onFormDataChange: (data: Partial<MikvahFormData>) => void;
}

const AmenitiesPage: React.FC<AmenitiesPageProps> = ({
  formData,
  onFormDataChange,
}) => {
  const handleToggle = useCallback(
    (field: keyof MikvahFormData) => {
      hapticButtonPress();
      onFormDataChange({ [field]: !formData[field] });
    },
    [formData, onFormDataChange],
  );

  const handlePriceChange = useCallback(
    (text: string) => {
      const value = parseFloat(text) || 0;
      onFormDataChange({ price_per_use: value });
    },
    [onFormDataChange],
  );

  const handleCurrencyChange = useCallback(
    (text: string) => {
      onFormDataChange({ currency: text });
    },
    [onFormDataChange],
  );

  const amenities = [
    {
      key: 'has_parking' as keyof MikvahFormData,
      icon: '🅿️',
      title: 'Parking Available',
      description: 'On-site parking for visitors',
      enabled: formData.has_parking,
    },
    {
      key: 'has_accessibility' as keyof MikvahFormData,
      icon: '♿',
      title: 'Accessibility Features',
      description: 'Wheelchair accessible facilities',
      enabled: formData.has_accessibility,
    },
    {
      key: 'has_private_rooms' as keyof MikvahFormData,
      icon: '🚪',
      title: 'Private Rooms',
      description: 'Individual private preparation rooms',
      enabled: formData.has_private_rooms,
    },
    {
      key: 'has_heating' as keyof MikvahFormData,
      icon: '🔥',
      title: 'Heating',
      description: 'Climate-controlled environment',
      enabled: formData.has_heating,
    },
    {
      key: 'has_air_conditioning' as keyof MikvahFormData,
      icon: '❄️',
      title: 'Air Conditioning',
      description: 'Cooling system for comfort',
      enabled: formData.has_air_conditioning,
    },
    {
      key: 'has_wifi' as keyof MikvahFormData,
      icon: '📶',
      title: 'WiFi Available',
      description: 'Free internet access for visitors',
      enabled: formData.has_wifi,
    },
  ];

  const paymentMethods = [
    {
      key: 'accepts_cash' as keyof MikvahFormData,
      icon: '💵',
      title: 'Cash',
      description: 'Accept cash payments',
      enabled: formData.accepts_cash,
    },
    {
      key: 'accepts_credit' as keyof MikvahFormData,
      icon: '💳',
      title: 'Credit Cards',
      description: 'Accept credit/debit cards',
      enabled: formData.accepts_credit,
    },
    {
      key: 'accepts_checks' as keyof MikvahFormData,
      icon: '📝',
      title: 'Checks',
      description: 'Accept personal/business checks',
      enabled: formData.accepts_checks,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Amenities & Pricing</Text>
          <Text style={styles.subtitle}>
            Tell us about your mikvah facilities and pricing
          </Text>
        </View>

        <View style={styles.form}>
          {/* Amenities Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <Text style={styles.sectionDescription}>
              Select all amenities available at your mikvah
            </Text>

            <View style={styles.amenitiesGrid}>
              {amenities.map(amenity => (
                <TouchableOpacity
                  key={amenity.key}
                  style={[
                    styles.amenityCard,
                    amenity.enabled && styles.amenityCardSelected,
                  ]}
                  onPress={() => handleToggle(amenity.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.amenityHeader}>
                    <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                    <View
                      style={[
                        styles.toggleSwitch,
                        amenity.enabled && styles.toggleSwitchActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          amenity.enabled && styles.toggleThumbActive,
                        ]}
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.amenityTitle,
                      amenity.enabled && styles.amenityTitleSelected,
                    ]}
                  >
                    {amenity.title}
                  </Text>
                  <Text
                    style={[
                      styles.amenityDescription,
                      amenity.enabled && styles.amenityDescriptionSelected,
                    ]}
                  >
                    {amenity.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pricing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Information</Text>
            <Text style={styles.sectionDescription}>
              Set your mikvah usage fees and accepted payment methods
            </Text>

            <View style={styles.pricingRow}>
              <View style={styles.priceInputGroup}>
                <Text style={styles.label}>Price per Use</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={formData.price_per_use?.toString() || ''}
                    onChangeText={handlePriceChange}
                    placeholder="0.00"
                    placeholderTextColor={Colors.text.secondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.currencyInputGroup}>
                <Text style={styles.label}>Currency</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={formData.currency}
                  onChangeText={handleCurrencyChange}
                  placeholder="USD"
                  placeholderTextColor={Colors.text.secondary}
                  autoCapitalize="characters"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

          {/* Payment Methods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <Text style={styles.sectionDescription}>
              Select which payment methods you accept
            </Text>

            <View style={styles.paymentGrid}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.paymentCard,
                    method.enabled && styles.paymentCardSelected,
                  ]}
                  onPress={() => handleToggle(method.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentIcon}>{method.icon}</Text>
                    <View
                      style={[
                        styles.toggleSwitch,
                        method.enabled && styles.toggleSwitchActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          method.enabled && styles.toggleThumbActive,
                        ]}
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.paymentTitle,
                      method.enabled && styles.paymentTitleSelected,
                    ]}
                  >
                    {method.title}
                  </Text>
                  <Text
                    style={[
                      styles.paymentDescription,
                      method.enabled && styles.paymentDescriptionSelected,
                    ]}
                  >
                    {method.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '700' as const,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.secondary,
  },
  form: {
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700' as const,
    color: Colors.text.primary,
  },
  sectionDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  amenitiesGrid: {
    gap: Spacing.md,
  },
  amenityCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
  },
  amenityCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  amenityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  amenityIcon: {
    fontSize: 24,
  },
  amenityTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  amenityTitleSelected: {
    color: Colors.primary.main,
  },
  amenityDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  amenityDescriptionSelected: {
    color: Colors.primary.dark,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  priceInputGroup: {
    flex: 2,
  },
  currencyInputGroup: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginRight: Spacing.xs,
  },
  priceInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    minHeight: TouchTargets.minimum,
  },
  currencyInput: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    minHeight: TouchTargets.minimum,
  },
  paymentGrid: {
    gap: Spacing.md,
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
  },
  paymentCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentIcon: {
    fontSize: 24,
  },
  paymentTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  paymentTitleSelected: {
    color: Colors.primary.main,
  },
  paymentDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  paymentDescriptionSelected: {
    color: Colors.primary.dark,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border.primary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary.main,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background.primary,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default AmenitiesPage;

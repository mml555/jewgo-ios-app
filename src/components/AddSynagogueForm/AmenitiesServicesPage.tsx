import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, TouchTargets } from '../../styles/designSystem';
import { hapticButtonPress } from '../../utils/hapticFeedback';

export interface SynagogueFormData {
  // Amenities
  has_parking: boolean;
  has_accessibility: boolean;
  has_wifi: boolean;
  has_kosher_kitchen: boolean;
  has_mikvah: boolean;
  has_library: boolean;
  has_youth_programs: boolean;
  has_adult_education: boolean;
  has_social_events: boolean;
  
  // Services
  daily_minyan: boolean;
  shabbat_services: boolean;
  holiday_services: boolean;
  lifecycle_services: boolean;
}

interface AmenitiesServicesPageProps {
  formData: SynagogueFormData;
  onFormDataChange: (data: Partial<SynagogueFormData>) => void;
}

const AmenitiesServicesPage: React.FC<AmenitiesServicesPageProps> = ({
  formData,
  onFormDataChange,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleToggle = useCallback((field: keyof SynagogueFormData) => {
    hapticButtonPress();
    onFormDataChange({ [field]: !formData[field] });
  }, [formData, onFormDataChange]);

  const amenities = [
    {
      key: 'has_parking' as keyof SynagogueFormData,
      icon: '🅿️',
      title: 'Parking Available',
      description: 'On-site parking for congregants',
      enabled: formData.has_parking,
    },
    {
      key: 'has_accessibility' as keyof SynagogueFormData,
      icon: '♿',
      title: 'Accessibility Features',
      description: 'Wheelchair accessible facilities',
      enabled: formData.has_accessibility,
    },
    {
      key: 'has_wifi' as keyof SynagogueFormData,
      icon: '📶',
      title: 'WiFi Available',
      description: 'Free internet access for congregants',
      enabled: formData.has_wifi,
    },
    {
      key: 'has_kosher_kitchen' as keyof SynagogueFormData,
      icon: '🍽️',
      title: 'Kosher Kitchen',
      description: 'Kosher kitchen facilities available',
      enabled: formData.has_kosher_kitchen,
    },
    {
      key: 'has_mikvah' as keyof SynagogueFormData,
      icon: '💧',
      title: 'Mikvah On-Site',
      description: 'Mikvah facilities available',
      enabled: formData.has_mikvah,
    },
    {
      key: 'has_library' as keyof SynagogueFormData,
      icon: '📚',
      title: 'Library',
      description: 'Jewish library and study materials',
      enabled: formData.has_library,
    },
    {
      key: 'has_youth_programs' as keyof SynagogueFormData,
      icon: '👶',
      title: 'Youth Programs',
      description: 'Programs for children and teens',
      enabled: formData.has_youth_programs,
    },
    {
      key: 'has_adult_education' as keyof SynagogueFormData,
      icon: '🎓',
      title: 'Adult Education',
      description: 'Classes and study groups for adults',
      enabled: formData.has_adult_education,
    },
    {
      key: 'has_social_events' as keyof SynagogueFormData,
      icon: '🎉',
      title: 'Social Events',
      description: 'Community events and celebrations',
      enabled: formData.has_social_events,
    },
  ];

  const services = [
    {
      key: 'daily_minyan' as keyof SynagogueFormData,
      icon: '🌅',
      title: 'Daily Minyan',
      description: 'Daily prayer services',
      enabled: formData.daily_minyan,
    },
    {
      key: 'shabbat_services' as keyof SynagogueFormData,
      icon: '🕯️',
      title: 'Shabbat Services',
      description: 'Friday night and Saturday services',
      enabled: formData.shabbat_services,
    },
    {
      key: 'holiday_services' as keyof SynagogueFormData,
      icon: '🎊',
      title: 'Holiday Services',
      description: 'High holiday and festival services',
      enabled: formData.holiday_services,
    },
    {
      key: 'lifecycle_services' as keyof SynagogueFormData,
      icon: '💒',
      title: 'Lifecycle Services',
      description: 'Bar/Bat Mitzvah, weddings, funerals',
      enabled: formData.lifecycle_services,
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
          <Text style={styles.title}>Amenities & Services</Text>
          <Text style={styles.subtitle}>Tell us about your synagogue's facilities and services</Text>
        </View>

        <View style={styles.form}>
          {/* Amenities Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <Text style={styles.sectionDescription}>
              Select all amenities available at your synagogue
            </Text>
            
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity) => (
                <TouchableOpacity
                  key={amenity.key}
                  style={[
                    styles.amenityCard,
                    amenity.enabled && styles.amenityCardSelected
                  ]}
                  onPress={() => handleToggle(amenity.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.amenityHeader}>
                    <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                    <View style={[
                      styles.checkbox,
                      amenity.enabled && styles.checkboxChecked
                    ]}>
                      {amenity.enabled && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                  <Text style={[
                    styles.amenityTitle,
                    amenity.enabled && styles.amenityTitleSelected
                  ]}>
                    {amenity.title}
                  </Text>
                  <Text style={[
                    styles.amenityDescription,
                    amenity.enabled && styles.amenityDescriptionSelected
                  ]}>
                    {amenity.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Services Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Religious Services</Text>
            <Text style={styles.sectionDescription}>
              Select all religious services offered by your synagogue
            </Text>
            
            <View style={styles.servicesGrid}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.key}
                  style={[
                    styles.serviceCard,
                    service.enabled && styles.serviceCardSelected
                  ]}
                  onPress={() => handleToggle(service.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <View style={[
                      styles.checkbox,
                      service.enabled && styles.checkboxChecked
                    ]}>
                      {service.enabled && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                  <Text style={[
                    styles.serviceTitle,
                    service.enabled && styles.serviceTitleSelected
                  ]}>
                    {service.title}
                  </Text>
                  <Text style={[
                    styles.serviceDescription,
                    service.enabled && styles.serviceDescriptionSelected
                  ]}>
                    {service.description}
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
    fontWeight: Typography.weights.bold,
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
    fontWeight: Typography.weights.bold,
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
    fontWeight: Typography.weights.semibold,
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
  servicesGrid: {
    gap: Spacing.md,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
  },
  serviceCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  serviceTitleSelected: {
    color: Colors.primary.main,
  },
  serviceDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  serviceDescriptionSelected: {
    color: Colors.primary.dark,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  checkmark: {
    color: Colors.background.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AmenitiesServicesPage;

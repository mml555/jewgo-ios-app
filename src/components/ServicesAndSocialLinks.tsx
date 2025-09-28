import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import { apiV5Service } from '../services/api-v5';
import { Entity, Service, SocialLink } from '../types/entities';

interface ServicesAndSocialLinksProps {
  entityId: string;
  entityType: 'restaurant' | 'synagogue' | 'mikvah' | 'store';
  onServiceUpdate?: (services: Service[]) => void;
  onSocialLinkUpdate?: (socialLinks: SocialLink[]) => void;
  editable?: boolean;
}

const ServicesAndSocialLinks: React.FC<ServicesAndSocialLinksProps> = ({
  entityId,
  entityType,
  onServiceUpdate,
  onSocialLinkUpdate,
  editable = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddSocialModal, setShowAddSocialModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // Common social platforms
  const socialPlatforms = [
    'facebook', 'instagram', 'twitter', 'whatsapp', 'tiktok', 
    'youtube', 'snapchat', 'linkedin', 'website'
  ];

  // Load entity services and social links
  const loadEntityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load entity details (this would include services and social links in a real implementation)
      const entityResponse = await apiV5Service.getEntity(entityType + 's' as any, entityId);
      
      if (entityResponse.success && entityResponse.data) {
        const entity = entityResponse.data.entity as Entity;
        
        // Mock data for demonstration - in real implementation, this would come from the API
        const mockServices: Service[] = [
          { id: '1', key: 'delivery', name: 'Delivery', description: 'Food delivery service', category: 'restaurant', isActive: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '2', key: 'takeout', name: 'Takeout', description: 'Takeout orders', category: 'restaurant', isActive: true, sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '3', key: 'catering', name: 'Catering', description: 'Catering services', category: 'restaurant', isActive: true, sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];

        const mockSocialLinks: SocialLink[] = [
          { id: '1', entityId, platform: 'facebook', url: 'https://facebook.com/example', isVerified: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '2', entityId, platform: 'instagram', url: 'https://instagram.com/example', isVerified: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];

        setServices(mockServices);
        setSocialLinks(mockSocialLinks);

        // Load available services for this entity type
        await loadAvailableServices();
      } else {
        setError('Failed to load entity data');
      }
    } catch (err) {
      setError('Failed to load entity data');
      console.error('Error loading entity data:', err);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  // Load available services for the entity type
  const loadAvailableServices = useCallback(async () => {
    try {
      // Mock available services - in real implementation, this would come from the API
      const mockAvailableServices: Service[] = [
        { id: '1', key: 'delivery', name: 'Delivery', description: 'Food delivery service', category: 'restaurant', isActive: true, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', key: 'takeout', name: 'Takeout', description: 'Takeout orders', category: 'restaurant', isActive: true, sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', key: 'catering', name: 'Catering', description: 'Catering services', category: 'restaurant', isActive: true, sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', key: 'dine_in', name: 'Dine In', description: 'In-restaurant dining', category: 'restaurant', isActive: true, sortOrder: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '5', key: 'outdoor_seating', name: 'Outdoor Seating', description: 'Outdoor dining area', category: 'restaurant', isActive: true, sortOrder: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];

      setAvailableServices(mockAvailableServices);
    } catch (err) {
      console.error('Error loading available services:', err);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadEntityData();
  }, [loadEntityData]);

  // Handle adding a service
  const handleAddService = useCallback(async (service: Service) => {
    try {
      // Mock API call - in real implementation, this would call the actual API
      const newServices = [...services, service];
      setServices(newServices);
      setShowAddServiceModal(false);
      onServiceUpdate?.(newServices);
      
      Alert.alert('Success', 'Service added successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to add service');
      console.error('Error adding service:', err);
    }
  }, [services, onServiceUpdate]);

  // Handle removing a service
  const handleRemoveService = useCallback(async (serviceId: string) => {
    try {
      Alert.alert(
        'Remove Service',
        'Are you sure you want to remove this service?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              const newServices = services.filter(s => s.id !== serviceId);
              setServices(newServices);
              onServiceUpdate?.(newServices);
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to remove service');
      console.error('Error removing service:', err);
    }
  }, [services, onServiceUpdate]);

  // Handle adding a social link
  const handleAddSocialLink = useCallback(async () => {
    if (!newSocialPlatform || !newSocialUrl) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // Mock API call - in real implementation, this would call the actual API
      const newSocialLink: SocialLink = {
        id: Date.now().toString(),
        entityId,
        platform: newSocialPlatform,
        url: newSocialUrl,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newSocialLinks = [...socialLinks, newSocialLink];
      setSocialLinks(newSocialLinks);
      setShowAddSocialModal(false);
      setNewSocialPlatform('');
      setNewSocialUrl('');
      onSocialLinkUpdate?.(newSocialLinks);
      
      Alert.alert('Success', 'Social link added successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to add social link');
      console.error('Error adding social link:', err);
    }
  }, [entityId, newSocialPlatform, newSocialUrl, socialLinks, onSocialLinkUpdate]);

  // Handle removing a social link
  const handleRemoveSocialLink = useCallback(async (socialLinkId: string) => {
    try {
      Alert.alert(
        'Remove Social Link',
        'Are you sure you want to remove this social link?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              const newSocialLinks = socialLinks.filter(sl => sl.id !== socialLinkId);
              setSocialLinks(newSocialLinks);
              onSocialLinkUpdate?.(newSocialLinks);
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to remove social link');
      console.error('Error removing social link:', err);
    }
  }, [socialLinks, onSocialLinkUpdate]);

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      whatsapp: '💬',
      tiktok: '🎵',
      youtube: '📺',
      snapchat: '👻',
      linkedin: '💼',
      website: '🌐',
    };
    return icons[platform] || '🔗';
  };

  // Render services section
  const renderServicesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🛠️ Services</Text>
        {editable && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddServiceModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {editable && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveService(service.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            {service.description && (
              <Text style={styles.serviceDescription}>{service.description}</Text>
            )}
            <Text style={styles.serviceCategory}>{service.category}</Text>
          </View>
        ))}
      </View>

      {services.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛠️</Text>
          <Text style={styles.emptyText}>No services added yet</Text>
          {editable && (
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddServiceModal(true)}
            >
              <Text style={styles.addFirstButtonText}>Add First Service</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // Render social links section
  const renderSocialLinksSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔗 Social Links</Text>
        {editable && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddSocialModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.socialLinksList}>
        {socialLinks.map((socialLink) => (
          <View key={socialLink.id} style={styles.socialLinkCard}>
            <View style={styles.socialLinkHeader}>
              <View style={styles.socialLinkInfo}>
                <Text style={styles.socialLinkIcon}>
                  {getPlatformIcon(socialLink.platform)}
                </Text>
                <View style={styles.socialLinkDetails}>
                  <Text style={styles.socialLinkPlatform}>
                    {socialLink.platform.charAt(0).toUpperCase() + socialLink.platform.slice(1)}
                  </Text>
                  <Text style={styles.socialLinkUrl}>{socialLink.url}</Text>
                </View>
              </View>
              <View style={styles.socialLinkActions}>
                {socialLink.isVerified && (
                  <Text style={styles.verifiedBadge}>✅</Text>
                )}
                {editable && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveSocialLink(socialLink.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {socialLinks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔗</Text>
          <Text style={styles.emptyText}>No social links added yet</Text>
          {editable && (
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddSocialModal(true)}
            >
              <Text style={styles.addFirstButtonText}>Add First Link</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // Render add service modal
  const renderAddServiceModal = () => (
    <Modal
      visible={showAddServiceModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Service</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowAddServiceModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>Available Services</Text>
          {availableServices
            .filter(service => !services.find(s => s.id === service.id))
            .map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.availableServiceCard}
                onPress={() => handleAddService(service)}
              >
                <Text style={styles.availableServiceName}>{service.name}</Text>
                <Text style={styles.availableServiceDescription}>
                  {service.description}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render add social link modal
  const renderAddSocialModal = () => (
    <Modal
      visible={showAddSocialModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Social Link</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowAddSocialModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>Platform</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformSelector}>
            {socialPlatforms.map((platform) => (
              <TouchableOpacity
                key={platform}
                style={[
                  styles.platformOption,
                  newSocialPlatform === platform && styles.platformOptionActive
                ]}
                onPress={() => setNewSocialPlatform(platform)}
              >
                <Text style={[
                  styles.platformOptionText,
                  newSocialPlatform === platform && styles.platformOptionTextActive
                ]}>
                  {getPlatformIcon(platform)} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.modalSubtitle}>URL</Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://..."
            value={newSocialUrl}
            onChangeText={setNewSocialUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddSocialLink}
          >
            <Text style={styles.saveButtonText}>Add Social Link</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading services and social links...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEntityData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderServicesSection()}
        {renderSocialLinksSection()}
      </ScrollView>

      {renderAddServiceModal()}
      {renderAddSocialModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.styles.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  section: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: 'bold',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  serviceName: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  serviceDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  serviceCategory: {
    ...Typography.styles.bodySmall,
    color: Colors.primary.main,
    fontWeight: '500',
  },
  socialLinksList: {
    gap: Spacing.sm,
  },
  socialLinkCard: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  socialLinkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialLinkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialLinkIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  socialLinkDetails: {
    flex: 1,
  },
  socialLinkPlatform: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  socialLinkUrl: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  socialLinkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  removeButton: {
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  addFirstButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addFirstButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    ...Typography.styles.h3,
    color: Colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalSubtitle: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  availableServiceCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  availableServiceName: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  availableServiceDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  platformSelector: {
    marginBottom: Spacing.lg,
  },
  platformOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformOptionActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  platformOptionText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  platformOptionTextActive: {
    color: Colors.white,
  },
  textInput: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Typography.styles.body,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default ServicesAndSocialLinks;

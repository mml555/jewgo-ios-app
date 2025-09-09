import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';

interface PhotosReviewPageProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  category: string;
}

const PhotosReviewPage: React.FC<PhotosReviewPageProps> = ({
  formData,
  onFormDataChange,
  category,
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(formData.photos || []);

  // Mock photos for demonstration
  const mockPhotos = [
    'https://picsum.photos/300/200?random=1',
    'https://picsum.photos/300/200?random=2',
    'https://picsum.photos/300/200?random=3',
    'https://picsum.photos/300/200?random=4',
    'https://picsum.photos/300/200?random=5',
    'https://picsum.photos/300/200?random=6',
  ];

  const handlePhotoSelect = useCallback((photoUrl: string) => {
    if (selectedPhotos.includes(photoUrl)) {
      setSelectedPhotos(prev => prev.filter(url => url !== photoUrl));
    } else if (selectedPhotos.length < 5) {
      setSelectedPhotos(prev => [...prev, photoUrl]);
    } else {
      Alert.alert('Maximum Photos', 'You can select up to 5 photos for your listing.');
    }
    
    onFormDataChange({ photos: selectedPhotos });
  }, [selectedPhotos, onFormDataChange]);

  const handleRemovePhoto = useCallback((photoUrl: string) => {
    const newPhotos = selectedPhotos.filter(url => url !== photoUrl);
    setSelectedPhotos(newPhotos);
    onFormDataChange({ photos: newPhotos });
  }, [selectedPhotos, onFormDataChange]);

  const formatAddress = useCallback(() => {
    const parts = [
      formData.address,
      formData.city,
      formData.state,
      formData.zipCode,
    ].filter(Boolean);
    return parts.join(', ');
  }, [formData]);

  const formatHours = useCallback((day: string) => {
    const hours = formData.hours?.[day];
    if (!hours || hours.closed) return 'Closed';
    return `${hours.open} - ${hours.close}`;
  }, [formData.hours]);

  const getKosherLevelLabel = useCallback((level: string) => {
    const levels: { [key: string]: string } = {
      'regular': 'Regular Kosher',
      'glatt': 'Glatt Kosher',
      'chalav-yisrael': 'Chalav Yisrael',
      'pas-yisrael': 'Pas Yisrael',
      'not-kosher': 'Not Kosher',
    };
    return levels[level] || 'Regular Kosher';
  }, []);

  const getAmenitiesList = useCallback(() => {
    const amenities = formData.amenities || {};
    return Object.entries(amenities)
      .filter(([_, value]) => value)
      .map(([key, _]) => {
        const labels: { [key: string]: string } = {
          'hasParking': 'Parking',
          'hasWifi': 'WiFi',
          'hasAccessibility': 'Accessible',
          'hasDelivery': 'Delivery',
          'hasTakeout': 'Takeout',
          'hasOutdoorSeating': 'Outdoor Seating',
        };
        return labels[key] || key;
      });
  }, [formData.amenities]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerEmoji}>📸</Text>
        <Text style={styles.headerTitle}>Photos & Review</Text>
        <Text style={styles.headerSubtitle}>
          Add photos and review your listing
        </Text>
      </View>

      {/* Photo Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Photos (Optional)</Text>
        <Text style={styles.sectionSubtitle}>
          Choose up to 5 photos to showcase your place
        </Text>
        
        <View style={styles.photoGrid}>
          {mockPhotos.map((photoUrl, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.photoItem,
                selectedPhotos.includes(photoUrl) && styles.photoItemSelected,
              ]}
              onPress={() => handlePhotoSelect(photoUrl)}
            >
              <Image source={{ uri: photoUrl }} style={styles.photoImage} />
              {selectedPhotos.includes(photoUrl) && (
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoCheckmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {selectedPhotos.length > 0 && (
          <View style={styles.selectedPhotosContainer}>
            <Text style={styles.selectedPhotosTitle}>Selected Photos:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedPhotos.map((photoUrl, index) => (
                <View key={index} style={styles.selectedPhotoItem}>
                  <Image source={{ uri: photoUrl }} style={styles.selectedPhotoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(photoUrl)}
                  >
                    <Text style={styles.removePhotoText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Review Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review Your Listing</Text>
        <Text style={styles.sectionSubtitle}>
          Please review all information before submitting
        </Text>
        
        <View style={styles.reviewCard}>
          {/* Basic Info */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Basic Information</Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Name:</Text> {formData.name || 'Not provided'}
            </Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Category:</Text> {formData.category || 'Not provided'}
            </Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Description:</Text> {formData.description || 'Not provided'}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Location & Contact</Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Address:</Text> {formatAddress() || 'Not provided'}
            </Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Phone:</Text> {formData.phone || 'Not provided'}
            </Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Email:</Text> {formData.email || 'Not provided'}
            </Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Website:</Text> {formData.website || 'Not provided'}
            </Text>
          </View>

          {/* Hours */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Operating Hours</Text>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <Text key={day} style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}:</Text> {formatHours(day)}
              </Text>
            ))}
          </View>

          {/* Amenities */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Amenities</Text>
            <Text style={styles.reviewItem}>
              {getAmenitiesList().length > 0 ? getAmenitiesList().join(', ') : 'None selected'}
            </Text>
          </View>

          {/* Kosher & Pricing */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Kosher & Pricing</Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Kosher Level:</Text> {getKosherLevelLabel(formData.kosherLevel)}
            </Text>
            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Price Range:</Text> {formData.priceRange || 'Not provided'}
            </Text>
            {formData.specialFeatures?.length > 0 && (
              <Text style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Special Features:</Text> {formData.specialFeatures.join(', ')}
              </Text>
            )}
          </View>

          {/* Photos */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Photos</Text>
            <Text style={styles.reviewItem}>
              {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        </View>
      </View>

      {/* Final Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>🎉 Almost Done!</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Your listing will be reviewed and published within 24 hours
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            You can edit your listing anytime from your profile
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Thank you for contributing to the Jewish community!
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  photoItemSelected: {
    borderColor: '#74e1a0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(116, 225, 160, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCheckmark: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectedPhotosContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  selectedPhotosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  selectedPhotoItem: {
    position: 'relative',
    marginRight: 8,
  },
  selectedPhotoImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  reviewItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
  reviewLabel: {
    fontWeight: '500',
    color: '#000000',
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

export default PhotosReviewPage;

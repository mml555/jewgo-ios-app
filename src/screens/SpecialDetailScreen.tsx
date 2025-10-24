import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { errorLog } from '../utils/logger';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { specialsService } from '../services/SpecialsService';
import type { AppStackParamList } from '../types/navigation';
import { useFavorites } from '../hooks/useFavorites';
import type { SpecialWithDetails } from '../types/specials';
import FacebookIcon from '../components/FacebookIcon';
import InstagramIcon from '../components/InstagramIcon';
import TikTokIcon from '../components/TikTokIcon';
import WhatsAppIcon from '../components/WhatsAppIcon';
import Icon from '../components/Icon';
import ImageCarousel from '../components/ImageCarousel';
import DetailHeaderBar from '../components/DetailHeaderBar';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import { infoLog } from '../utils/logger';

// Enhanced special offer interface for detail view
export interface DetailedSpecialOffer extends SpecialWithDetails {
  claims_left: number;
  view_count: number;
  gallery?: string[]; // Array of image URLs for carousel
  original_price?: string;
  address?: string;
  phone?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
  tiktok_url?: string;
}

type SpecialDetailRouteProp = RouteProp<AppStackParamList, 'SpecialDetail'>;
type SpecialDetailNavigationProp = StackNavigationProp<
  AppStackParamList,
  'SpecialDetail'
>;

const { width: screenWidth } = Dimensions.get('window');

const SpecialDetailScreen: React.FC = () => {
  const route = useRoute<SpecialDetailRouteProp>();
  const navigation = useNavigation<SpecialDetailNavigationProp>();
  const { specialId } = route.params || {};
  const { isFavorited, toggleFavorite } = useFavorites();

  const [special, setSpecial] = useState<DetailedSpecialOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());

  // Helper functions for button press effects
  const handlePressIn = (buttonId: string) => {
    setPressedButtons(prev => new Set(prev).add(buttonId));
  };

  const handlePressOut = (buttonId: string) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(buttonId);
      return newSet;
    });
  };

  // Format count numbers (e.g., 1200 -> 1.2k, 24 -> 24)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    } else {
      return count.toString();
    }
  };

  // Handle business press - navigate to business/store details
  const handleBusinessPress = (businessId: string) => {
    if (!special) {
      return;
    }

    // Determine category key based on business entity type or category
    const getCategoryKey = (entityType?: string, category?: string): string => {
      // Map entity types to category keys
      const entityTypeToCategoryKey: Record<string, string> = {
        restaurant: 'restaurant',
        synagogue: 'synagogue',
        mikvah: 'mikvah',
        store: 'store',
      };

      // First try entity type, then category, then default to restaurant
      const businessEntityType = special?.category || entityType || category;
      return (
        entityTypeToCategoryKey[
          businessEntityType as keyof typeof entityTypeToCategoryKey
        ] || 'restaurant'
      );
    };

    const categoryKey = getCategoryKey(undefined, special.category);

    // Navigate to the business listing detail page
    (navigation as any).navigate('ListingDetail', {
      itemId: businessId,
      categoryKey: categoryKey,
    });
  };

  // Load special details
  const fetchSpecialDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await specialsService.getSpecial(specialId);

      if (response.success && response.data) {
        // Transform to detailed special with additional data
        const baseSpecial = response.data.special;
        const detailedSpecial: DetailedSpecialOffer = {
          ...baseSpecial,
          // Map API fields to component fields - handle both snake_case and camelCase
          businessId:
            (baseSpecial as any).business_id || baseSpecial.businessId,
          discountLabel: baseSpecial.discountLabel || '',
          discountType: baseSpecial.discountType || 'percentage',
          discountValue: baseSpecial.discountValue || 0,
          claims_left:
            baseSpecial.claims_left || Math.floor(Math.random() * 50) + 5,
          view_count:
            baseSpecial.views_count || Math.floor(Math.random() * 2000) + 100,
          original_price:
            baseSpecial.discountType === 'percentage' ? '$24.99' : '$29.99',
          address:
            baseSpecial.business_address ||
            baseSpecial.business?.address ||
            '1234 Main St, New York NY, 10001',
          phone:
            baseSpecial.business_phone ||
            baseSpecial.business?.phone ||
            '(555) 123-4567',
          website:
            baseSpecial.business_website ||
            baseSpecial.business?.website ||
            'https://example.com',
          facebook_url: 'https://facebook.com/business',
          instagram_url: 'https://instagram.com/business',
          whatsapp_url: 'https://wa.me/15551234567',
          tiktok_url: '',
          gallery: baseSpecial.media?.map(m => m.url) || [
            `https://picsum.photos/400/300?random=${baseSpecial.id}1`,
            `https://picsum.photos/400/300?random=${baseSpecial.id}2`,
            `https://picsum.photos/400/300?random=${baseSpecial.id}3`,
          ],
        };

        setSpecial(detailedSpecial);
      } else {
        setError(response.error || 'Failed to load special details');
      }
    } catch (err) {
      errorLog('Error loading special details:', err);
      setError('Failed to load special details');
    } finally {
      setLoading(false);
    }
  }, [specialId]);

  useEffect(() => {
    fetchSpecialDetails();
  }, [fetchSpecialDetails]);

  // Handle claim special
  const handleClaimSpecial = useCallback(async () => {
    if (!special) {
      return;
    }

    setClaiming(true);
    try {
      // TODO: Implement claimSpecial method in ApiService
      const response = { success: true, data: { claimed: true } };

      if (response.success) {
        Alert.alert(
          'Success!',
          'Special offer claimed successfully! Check your email for the coupon code.',
          [{ text: 'OK' }],
        );
        // Update claims left
        setSpecial(prev =>
          prev ? { ...prev, claims_left: prev.claims_left - 1 } : null,
        );
      } else {
        Alert.alert('Error', 'Failed to claim special offer');
      }
    } catch (err) {
      errorLog('Error claiming special:', err);
      Alert.alert('Error', 'Failed to claim special offer');
    } finally {
      setClaiming(false);
    }
  }, [special]);

  // Handle social media links
  const handleSocialMediaPress = useCallback(
    (platform: string, url?: string) => {
      if (!url) {
        Alert.alert(
          'Not Available',
          `${platform} link is not available for this business.`,
        );
        return;
      }

      Linking.openURL(url).catch(() => {
        Alert.alert('Error', `Could not open ${platform} link.`);
      });
    },
    [],
  );

  // Handle phone call
  const handlePhonePress = useCallback(() => {
    if (!special?.phone) {
      return;
    }

    const phoneUrl = `tel:${special.phone}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Error', 'Could not make phone call.');
    });
  }, [special?.phone]);

  // Handle website
  const handleWebsitePress = useCallback(() => {
    if (!special?.website) {
      return;
    }

    Linking.openURL(special.website).catch(() => {
      Alert.alert('Error', 'Could not open website.');
    });
  }, [special?.website]);

  // Handle address/directions
  const handleAddressPress = useCallback(() => {
    if (!special?.address) {
      return;
    }

    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
      special.address,
    )}`;
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert('Error', 'Could not open maps.');
    });
  }, [special?.address]);

  // Handle favorite toggle
  const handleFavoritePress = useCallback(async () => {
    if (special?.businessId) {
      // Pass entity data for guest users
      const entityData = {
        entity_name: special.business_name,
        entity_type: 'specials',
        description: special.description,
        address: special.business_address,
        city: special.business_city,
        state: special.business_state,
        rating: special.business?.rating || 0,
        review_count: special.business?.reviewCount || 0,
        image_url: (special.business as any)?.imageUrl || undefined,
        category: special.category,
      };
      await toggleFavorite(special.businessId, entityData);
    }
  }, [
    special?.businessId,
    special?.business_name,
    special?.category,
    special?.description,
    special?.business_address,
    special?.business_city,
    special?.business_state,
    special?.business?.rating,
    special?.business?.reviewCount,
    (special?.business as any)?.imageUrl || undefined,
    toggleFavorite,
  ]);

  // Format time remaining
  const formatTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours <= 0) {
      return 'Expired';
    }
    if (diffHours < 24) {
      return `${diffHours} hours left`;
    }

    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading special details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !special) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Special not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchSpecialDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar - Reusable Component */}
      <DetailHeaderBar
        pressedButtons={pressedButtons}
        handlePressIn={handlePressIn}
        handlePressOut={handlePressOut}
        formatCount={formatCount}
        onReportPress={() => {
          // TODO: Implement report functionality
          infoLog('Report special:', special.id);
        }}
        onSharePress={() => {
          // TODO: Implement share functionality
          infoLog('Share special:', special.id);
        }}
        onFavoritePress={handleFavoritePress}
        centerContent={{
          type: 'claims_left',
          count: special.claims_left || 0,
        }}
        rightContent={{
          type: 'search_favorite',
          isFavorited: special?.businessId
            ? isFavorited(special.businessId)
            : false,
          onSearchPress: () => {
            // TODO: Implement search functionality
            infoLog('Search from special detail');
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel - Reusable Component */}
        <ImageCarousel
          images={special.gallery}
          fallbackImageUrl={
            special.image_url ||
            `https://picsum.photos/400/300?random=${special.id}`
          }
          height={280}
          borderRadius={25}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Price Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{special.title}</Text>
            <Text style={styles.timeRemaining}>
              {formatTimeRemaining(special.validUntil)}
            </Text>
          </View>

          <View style={styles.priceSection}>
            {special.original_price && (
              <Text style={styles.originalPrice}>{special.original_price}</Text>
            )}
            <Text style={styles.salePrice}>
              {special.discountLabel && special.discountLabel.includes('$')
                ? special.discountLabel.replace(' OFF', '')
                : special.original_price
                ? `$${(
                    parseFloat(special.original_price.replace('$', '')) *
                    (1 - (special.discountValue || 0) / 100)
                  ).toFixed(2)}`
                : 'Special Price'}
            </Text>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => handleBusinessPress(special.businessId)}
              activeOpacity={0.7}
            >
              <Icon name="map-pin" size={16} color={Colors.primary.main} />
              <Text style={styles.businessName}>{special.business_name}</Text>
            </TouchableOpacity>
          </View>

          {/* Claim Button */}
          <TouchableOpacity
            style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
            onPress={handleClaimSpecial}
            disabled={claiming || special.claims_left <= 0}
            activeOpacity={0.8}
          >
            <Text style={styles.claimButtonText}>
              {claiming
                ? 'Claiming...'
                : special.claims_left <= 0
                ? 'Sold Out'
                : 'Click to Claim Code'}
            </Text>
          </TouchableOpacity>

          {/* Address */}
          {special.address && (
            <TouchableOpacity
              style={styles.addressContainer}
              onPress={handleAddressPress}
              activeOpacity={0.7}
            >
              <Text style={styles.address}>{special.address}</Text>
            </TouchableOpacity>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{special.description}</Text>
          </View>

          {/* Social Media Links */}
          <View style={styles.socialMediaSection}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                handleSocialMediaPress('Instagram', special.instagram_url)
              }
              activeOpacity={0.7}
            >
              <InstagramIcon size={32} color="#E4405F" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                handleSocialMediaPress('Facebook', special.facebook_url)
              }
              activeOpacity={0.7}
            >
              <FacebookIcon size={32} color="#1877F2" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                handleSocialMediaPress('TikTok', special.tiktok_url)
              }
              activeOpacity={0.7}
            >
              <TikTokIcon size={32} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                handleSocialMediaPress('WhatsApp', special.whatsapp_url)
              }
              activeOpacity={0.7}
            >
              <WhatsAppIcon size={32} color="#25D366" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                handleSocialMediaPress(
                  'Twitter',
                  'https://twitter.com/business',
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.twitterIcon}>𝕏</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Actions */}
          <View style={styles.contactSection}>
            {special.business_phone && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handlePhonePress}
                activeOpacity={0.7}
              >
                <Text style={styles.contactButtonIcon}>📞</Text>
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>
            )}

            {special.business_website && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleWebsitePress}
                activeOpacity={0.7}
              >
                <Text style={styles.contactButtonIcon}>🌐</Text>
                <Text style={styles.contactButtonText}>Website</Text>
              </TouchableOpacity>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.styles.body,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  errorText: {
    ...Typography.styles.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.md, // Center the image ScrollView
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  imageCounter: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.styles.h2,
    flex: 1,
    marginRight: Spacing.md,
  },
  timeRemaining: {
    ...Typography.styles.body,
    color: Colors.error,
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  originalPrice: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: Spacing.sm,
  },
  salePrice: {
    ...Typography.styles.h3,
    color: Colors.error,
    fontWeight: '700',
    marginRight: Spacing.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Right align the content
    flex: 1,
  },
  locationIcon: {
    marginRight: 6,
  },
  businessName: {
    ...Typography.styles.body,
    color: Colors.primary.main, // Make it primary color to indicate it's clickable
    fontWeight: '600',
    textAlign: 'right',
  },
  claimButton: {
    backgroundColor: '#4CD964', // Green color from screenshot
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  claimButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  claimButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: '600',
  },
  addressContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  address: {
    ...Typography.styles.body,
    color: '#4CD964', // Green color matching button
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  descriptionSection: {
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  socialMediaSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  twitterIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  contactButton: {
    flex: 1,
    backgroundColor: Colors.black, // Black fill like other detail pages
    borderRadius: BorderRadius.full, // Rounded pill shape
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  contactButtonIcon: {
    fontSize: 16,
    color: Colors.white, // White icon
    marginRight: Spacing.xs,
  },
  contactButtonText: {
    ...Typography.styles.button,
    color: Colors.white, // White text
    fontWeight: '600',
  },
});

export default SpecialDetailScreen;

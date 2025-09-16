import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { apiService, DetailedListing, Review } from '../services/api';
import { useReviews } from '../hooks/useReviews';
import EateryIcon from '../components/EateryIcon';
import FacebookIcon from '../components/FacebookIcon';
import InstagramIcon from '../components/InstagramIcon';
import TikTokIcon from '../components/TikTokIcon';
import WhatsAppIcon from '../components/WhatsAppIcon';
import ReviewsModal from '../components/ReviewsModal';
import WriteReviewModal from '../components/WriteReviewModal';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';

// Types
interface ListingDetailParams {
  itemId: string;
  categoryKey: string;
}

const { width: screenWidth } = Dimensions.get('window');

const ListingDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId, categoryKey } = route.params as ListingDetailParams;
  const { location, getCurrentLocation } = useLocation();
  const { reviews, loading: reviewsLoading, error: reviewsError, writeReview, loadReviews } = useReviews();

  const [item, setItem] = useState<DetailedListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'verified' | 'recent' | 'rating_5' | 'rating_4' | 'rating_3' | 'rating_2' | 'rating_1'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showHoursDropdown, setShowHoursDropdown] = useState(false);
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

  // Handle special card navigation
  const handleSpecialPress = (specialType: string) => {
    // For now, we'll show an alert. In a real app, this would navigate to a special details page
    Alert.alert(
      `${specialType} Details`,
      `This would navigate to the ${specialType.toLowerCase()} details page with more information, terms, and conditions.`,
      [{ text: 'OK' }]
    );
  };

  // Handle social media press
  const handleSocialMediaPress = (platform: string, url: string) => {
    // For now, we'll show an alert. In a real app, this would open the social media link
    Alert.alert(
      `Open ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      `This would open ${url} in the browser or social media app.`,
      [{ text: 'OK' }]
    );
  };

  // Calculate real distance if user location is available
  const realDistance = useMemo(() => {
    if (location && item?.latitude && item?.longitude) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        item.latitude,
        item.longitude
      );
      console.log('📍 Distance calculated:', `${distance.toFixed(1)} miles`);
      console.log('📍 Location coords:', location.latitude, location.longitude);
      console.log('📍 Item coords:', item.latitude, item.longitude);
      
      // For testing: allow larger distances since iOS simulator gives SF location
      // In production, this should be much smaller (like 50-100 miles)
      if (distance > 20000) { // 20,000 miles - basically anywhere on Earth
        console.log('📍 Distance too large, likely incorrect coordinates');
        return null;
      }
      
      return distance;
    }
    console.log('📍 No location or coordinates available:', { 
      hasLocation: !!location, 
      hasItemLat: !!item?.latitude, 
      hasItemLng: !!item?.longitude 
    });
    return null;
  }, [location, item]);

  // Fetch item details
  const fetchItemDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getListing(itemId);
      if (response.success && response.data) {
        setItem(response.data.listing);
        // Load reviews separately to avoid circular dependency
        loadReviews(itemId);
      } else {
        setError('Failed to load listing details');
      }
    } catch (err) {
      setError('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  }, [itemId]); // Remove loadReviews from dependencies

  useEffect(() => {
    fetchItemDetails();
    // Request location for distance calculation
    getCurrentLocation();
  }, [fetchItemDetails, getCurrentLocation]);

  // Debug: Track modal state changes
  useEffect(() => {
    // Modal state changed
  }, [showWriteReviewModal]);


  // Handle image swipe
  const handleImageSwipe = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    // ScrollView width is now screen width minus margins
    const imageWidth = screenWidth - (Spacing.md * 2); // Image width
    const index = Math.round(contentOffset.x / imageWidth);
    console.log('🖼️ Image swipe - contentOffset.x:', contentOffset.x, 'imageWidth:', imageWidth, 'index:', index);
    setActiveImageIndex(index);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
  };

  // Handle rating press
  const handleRatingPress = () => {
    setShowReviewsModal(true);
  };

  // Handle write review
  const handleWriteReview = () => {
    setShowReviewsModal(false); // Close reviews modal if open
    setShowWriteReviewModal(true);
  };

  // Handle submit review
  const handleSubmitReview = async (review: { rating: number; title: string; content: string }) => {
    if (!item) return;

    const success = await writeReview(item.id, {
      rating: review.rating,
      title: review.title,
      content: review.content,
      userId: '33333333-3333-3333-3333-333333333333', // Use a sample user ID for now
    });

    if (success) {
      setShowWriteReviewModal(false);
      Alert.alert('Success', 'Your review has been submitted!');
      await fetchItemDetails();
    } else {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  // Get paginated reviews
  const getPaginatedReviews = () => {
    if (!reviews) return [];
    
    let sortedReviews = [...reviews];
    
    // Apply filtering and sorting
    switch (sortBy) {
      case 'newest':
        sortedReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sortedReviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'rating_high':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_low':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'verified':
        sortedReviews = sortedReviews.filter(review => review.is_verified);
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        sortedReviews = sortedReviews.filter(review => new Date(review.created_at) > thirtyDaysAgo);
        break;
      case 'rating_5':
        sortedReviews = sortedReviews.filter(review => review.rating === 5);
        break;
      case 'rating_4':
        sortedReviews = sortedReviews.filter(review => review.rating === 4);
        break;
      case 'rating_3':
        sortedReviews = sortedReviews.filter(review => review.rating === 3);
        break;
      case 'rating_2':
        sortedReviews = sortedReviews.filter(review => review.rating === 2);
        break;
      case 'rating_1':
        sortedReviews = sortedReviews.filter(review => review.rating === 1);
        break;
    }
    
    const startIndex = (currentPage - 1) * 5;
    return sortedReviews.slice(startIndex, startIndex + 5);
  };

  // Get total pages
  const getTotalPages = () => {
    if (!reviews) return 1;
    
    let sortedReviews = [...reviews];
    
    // Apply same filtering logic as getPaginatedReviews
    switch (sortBy) {
      case 'verified':
        sortedReviews = sortedReviews.filter(review => review.is_verified);
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        sortedReviews = sortedReviews.filter(review => new Date(review.created_at) > thirtyDaysAgo);
        break;
      case 'rating_5':
        sortedReviews = sortedReviews.filter(review => review.rating === 5);
        break;
      case 'rating_4':
        sortedReviews = sortedReviews.filter(review => review.rating === 4);
        break;
      case 'rating_3':
        sortedReviews = sortedReviews.filter(review => review.rating === 3);
        break;
      case 'rating_2':
        sortedReviews = sortedReviews.filter(review => review.rating === 2);
        break;
      case 'rating_1':
        sortedReviews = sortedReviews.filter(review => review.rating === 1);
        break;
    }
    
    return Math.ceil(sortedReviews.length / 5);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'verified' | 'recent' | 'rating_5' | 'rating_4' | 'rating_3' | 'rating_2' | 'rating_1') => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Format time from 24-hour format to 12-hour format
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Ensure image URLs are working
  const getWorkingImageUrl = (url: string): string => {
    if (url.includes('picsum.photos')) {
      // For now, keep using picsum.photos but ensure proper dimensions
      const randomMatch = url.match(/random=(\d+)/);
      const randomId = randomMatch ? randomMatch[1] : '1';
      
      // Use picsum.photos with proper dimensions for the carousel
      return `https://picsum.photos/400/300?random=${randomId}`;
    }
    return url;
  };

  // Transform business hours from API format (array with day_of_week numbers) to display format (object with day names)
  const transformBusinessHours = (businessHours: any[]) => {
    if (!businessHours || !Array.isArray(businessHours)) return {};
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const transformed: any = {};
    
    businessHours.forEach(hours => {
      const dayName = dayNames[hours.day_of_week];
      if (dayName) {
        transformed[dayName] = {
          open_time: hours.open_time,
          close_time: hours.close_time,
          is_closed: hours.is_closed
        };
      }
    });
    
    return transformed;
  };

  // Get business hours status
  const getBusinessHoursStatus = () => {
    if (!item?.business_hours) return { isOpen: false, nextChange: null };
    
    const transformedHours = transformBusinessHours(item.business_hours);
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDayName = dayNames[currentDay];
    const todayHours = transformedHours[todayDayName];
    
    if (!todayHours || todayHours.is_closed) {
      return { isOpen: false, nextChange: null };
    }
    
    const openTime = todayHours.open_time.split(':').map(Number);
    const closeTime = todayHours.close_time.split(':').map(Number);
    const openMinutes = openTime[0] * 60 + openTime[1];
    const closeMinutes = closeTime[0] * 60 + closeTime[1];
    
    const isOpen = currentTime >= openMinutes && currentTime < closeMinutes;
    
    return {
      isOpen,
      nextChange: isOpen ? formatTime(todayHours.close_time) : formatTime(todayHours.open_time)
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchItemDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const businessStatus = getBusinessHoursStatus();

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Header Bar */}
        <View style={styles.imageHeaderBar}>
          <TouchableOpacity 
            style={[
              styles.headerBackButton,
              pressedButtons.has('back') && styles.headerButtonPressed
            ]}
            onPress={() => navigation.goBack()}
            onPressIn={() => handlePressIn('back')}
            onPressOut={() => handlePressOut('back')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerText}>DETAILS</Text>
          <Text style={styles.headerSubText}>VIEW</Text>
          <View style={styles.viewCountGroup}>
            <Text style={styles.eyeIcon}>👁</Text>
            <Text style={styles.viewCount}>1.2k</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.shareButton,
              pressedButtons.has('share') && styles.headerButtonPressed
            ]}
            onPressIn={() => handlePressIn('share')}
            onPressOut={() => handlePressOut('share')}
            activeOpacity={0.7}
          >
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.heartButton,
              pressedButtons.has('heart') && styles.headerButtonPressed
            ]}
            onPress={handleFavoriteToggle}
            onPressIn={() => handlePressIn('heart')}
            onPressOut={() => handlePressOut('heart')}
            activeOpacity={0.7}
          >
            <Text style={[styles.heartIcon, isFavorited && styles.heartIconActive]}>
              {isFavorited ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleImageSwipe}
                style={[styles.imageScrollView, { width: screenWidth - (Spacing.md * 2) }]}
                contentContainerStyle={styles.imageScrollViewContent}
              >
                {item.images.map((image, index) => {
                  const workingUrl = getWorkingImageUrl(image);
                  console.log('🖼️ Rendering image', index, ':', workingUrl);
                  return (
                    <Image
                      key={index}
                      source={{ uri: workingUrl }}
                      style={styles.image}
                      resizeMode="cover"
                      accessible={true}
                      accessibilityLabel={`Image ${index + 1} of ${item.images?.length || 0}`}
                      onLoad={() => console.log('🖼️ Image loaded:', index, workingUrl)}
                      onError={(error) => console.log('🖼️ Image error:', index, workingUrl, error)}
                    />
                  );
                })}
              </ScrollView>
              
              {/* Image Indicators */}
              {item.images.length > 1 && (
                <>
                  {/* Page Counter Pill */}
                  <View style={styles.pageCounterPill}>
                    <Text style={styles.pageCounterText}>
                      {activeImageIndex + 1} of {item.images.length}
                    </Text>
                  </View>
                  
                  {/* Image Dots */}
                  <View style={styles.imageIndicators}>
                    {item.images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === activeImageIndex && styles.indicatorActive
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No images available</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Rating */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{item.title}</Text>
            <TouchableOpacity 
              style={styles.ratingButton} 
              onPress={handleRatingPress}
              activeOpacity={0.7}
            >
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingText}>
                  {(() => {
                    const rating = item.rating as any;
                    if (typeof rating === 'number') {
                      return rating.toFixed(1);
                    } else if (rating) {
                      return parseFloat(String(rating)).toFixed(1);
                    }
                    return '0.0';
                  })()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Price and Distance */}
          <View style={styles.infoRow}>
            <Text style={styles.priceText}>{(item as any).price_range || '$$'}</Text>
            <Text style={styles.distanceText}>
              {realDistance ? `${realDistance.toFixed(1)} mi` : (item.zip_code ? `${item.zip_code}` : 'Location N/A')}
            </Text>
          </View>

          {/* Hours */}
          <TouchableOpacity 
            style={styles.hoursButton}
            onPress={() => setShowHoursDropdown(!showHoursDropdown)}
            activeOpacity={0.7}
          >
            <Text style={styles.hoursText}>
              🕒 Hours: 
              <Text style={[styles.statusText, businessStatus.isOpen ? styles.statusOpen : styles.statusClosed]}>
                {businessStatus.isOpen ? ' Open' : ' Closed'}
              </Text>
              {businessStatus.nextChange && (
                <Text style={styles.nextChangeText}>
                  {businessStatus.isOpen ? ' closes at ' : ' opens at '}{businessStatus.nextChange}
                </Text>
              )}
              <Text style={styles.dropdownIcon}> ▼</Text>
            </Text>
          </TouchableOpacity>

          {/* Hours Dropdown */}
          {showHoursDropdown && item.business_hours && (
            <View style={styles.hoursDropdown}>
              {Object.entries(transformBusinessHours(item.business_hours)).map(([day, hours]) => (
                <View key={day} style={styles.hoursRow}>
                  <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                  <Text style={styles.hoursText}>
                    {(hours as any).is_closed ? 'Closed' : `${formatTime((hours as any).open_time)} - ${formatTime((hours as any).close_time)}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Address */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {item.address}
              {item.city && `, ${item.city}`}
              {item.state && `, ${item.state}`}
              {item.zip_code && ` ${item.zip_code}`}
            </Text>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.contactButton,
                pressedButtons.has('call') && styles.contactButtonPressed
              ]}
              onPressIn={() => handlePressIn('call')}
              onPressOut={() => handlePressOut('call')}
              activeOpacity={0.7}
            >
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.contactButton,
                pressedButtons.has('website') && styles.contactButtonPressed
              ]}
              onPressIn={() => handlePressIn('website')}
              onPressOut={() => handlePressOut('website')}
              activeOpacity={0.7}
            >
              <Text style={styles.contactButtonText}>Website</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.contactButton,
                pressedButtons.has('email') && styles.contactButtonPressed
              ]}
              onPressIn={() => handlePressIn('email')}
              onPressOut={() => handlePressOut('email')}
              activeOpacity={0.7}
            >
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Order Button */}
          <TouchableOpacity 
            style={[
              styles.orderButton,
              pressedButtons.has('order-now') && styles.orderButtonPressed
            ]}
            onPressIn={() => handlePressIn('order-now')}
            onPressOut={() => handlePressOut('order-now')}
            activeOpacity={0.7}
          >
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>

          {/* Feature Tags */}
          <View style={styles.featureTagsContainer}>
            <View style={[styles.featureTag, styles.featureTagPrimary]}>
              <Text style={styles.featureTagText}>Popular</Text>
            </View>
            <View style={[styles.featureTag, styles.featureTagSecondary]}>
              <Text style={styles.featureTagText}>Trending</Text>
            </View>
            <View style={[styles.featureTag, styles.featureTagAccent]}>
              <Text style={styles.featureTagText}>New</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {(item as any).tags?.map((tag: any, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Special Cards */}
          <View style={styles.specialCardsContainer}>
            <TouchableOpacity 
              style={[
                styles.specialCard,
                pressedButtons.has('happy-hour') && styles.specialCardPressed
              ]}
              onPress={() => handleSpecialPress('Happy Hour')}
              onPressIn={() => handlePressIn('happy-hour')}
              onPressOut={() => handlePressOut('happy-hour')}
              activeOpacity={0.8}
            >
              <View style={styles.specialCardImage}>
                <Text style={styles.specialCardImageText}>🍺</Text>
              </View>
              <View style={styles.specialCardContent}>
                <Text style={styles.specialCardTitle}>Happy Hour</Text>
                <Text style={styles.specialCardDescription}>50% off drinks</Text>
                <Text style={styles.specialCardDescription}>4-6 PM</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.specialCard,
                pressedButtons.has('student-deal') && styles.specialCardPressed
              ]}
              onPress={() => handleSpecialPress('Student Deal')}
              onPressIn={() => handlePressIn('student-deal')}
              onPressOut={() => handlePressOut('student-deal')}
              activeOpacity={0.8}
            >
              <View style={styles.specialCardImage}>
                <Text style={styles.specialCardImageText}>🎓</Text>
              </View>
              <View style={styles.specialCardContent}>
                <Text style={styles.specialCardTitle}>Student Deal</Text>
                <Text style={styles.specialCardDescription}>15% off with ID</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.specialCard,
                pressedButtons.has('weekend-deal') && styles.specialCardPressed
              ]}
              onPress={() => handleSpecialPress('Weekend Deal')}
              onPressIn={() => handlePressIn('weekend-deal')}
              onPressOut={() => handlePressOut('weekend-deal')}
              activeOpacity={0.8}
            >
              <View style={styles.specialCardImage}>
                <EateryIcon size={24} color="#FFFFFF" />
              </View>
              <View style={styles.specialCardContent}>
                <Text style={styles.specialCardTitle}>Weekend Deal</Text>
                <Text style={styles.specialCardDescription}>Free appetizer</Text>
                <Text style={styles.specialCardDescription}>with entree</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Social Media Icons */}
          {(item.facebook_url || item.instagram_url || item.whatsapp_url || item.tiktok_url) && (
            <View style={styles.socialMediaContainer}>
              <Text style={styles.socialMediaTitle}>Follow Us</Text>
              <View style={styles.socialMediaIcons}>
                {item.facebook_url && (
                  <TouchableOpacity 
                    style={styles.socialMediaButton}
                    onPress={() => handleSocialMediaPress('facebook', item.facebook_url!)}
                    activeOpacity={0.7}
                  >
                    <FacebookIcon size={24} color="#1877F2" />
                  </TouchableOpacity>
                )}
                {item.instagram_url && (
                  <TouchableOpacity 
                    style={styles.socialMediaButton}
                    onPress={() => handleSocialMediaPress('instagram', item.instagram_url!)}
                    activeOpacity={0.7}
                  >
                    <InstagramIcon size={24} color="#E4405F" />
                  </TouchableOpacity>
                )}
                {item.whatsapp_url && (
                  <TouchableOpacity 
                    style={styles.socialMediaButton}
                    onPress={() => handleSocialMediaPress('whatsapp', item.whatsapp_url!)}
                    activeOpacity={0.7}
                  >
                    <WhatsAppIcon size={24} color="#25D366" />
                  </TouchableOpacity>
                )}
                {item.tiktok_url && (
                  <TouchableOpacity 
                    style={styles.socialMediaButton}
                    onPress={() => handleSocialMediaPress('tiktok', item.tiktok_url!)}
                    activeOpacity={0.7}
                  >
                    <TikTokIcon size={24} color="#000000" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Long Description */}
          {item.long_description && (
            <View style={styles.longDescriptionContainer}>
              <Text style={styles.longDescriptionTitle}>About Us</Text>
              <Text style={styles.longDescriptionText}>{item.long_description}</Text>
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSectionContainer}>
            <View style={styles.reviewsSectionHeader}>
              <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
              <TouchableOpacity 
                style={styles.writeReviewButton}
                onPress={handleWriteReview}
                activeOpacity={0.7}
              >
                <Text style={styles.writeReviewButtonText}>Write Review</Text>
              </TouchableOpacity>
            </View>
            
            {reviews && reviews.length > 0 ? (
              <View style={styles.reviewsSectionContainer}>
                {reviews.slice(0, 5).map((review, index) => (
                  <View key={review.id || index} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUserInfo}>
                        <View style={styles.reviewUserAvatar}>
                          <Text style={styles.reviewUserInitial}>
                            {(review as any).user_name ? (review as any).user_name.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                        <View style={styles.reviewUserDetails}>
                          <Text style={styles.reviewUserName}>
                            {(review as any).user_name || 'Anonymous User'}
                          </Text>
                          <View style={styles.reviewRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Text 
                                key={star} 
                                style={[
                                  styles.reviewStar,
                                  star <= (Number(review.rating) || 0) && styles.reviewStarFilled
                                ]}
                              >
                                ★
                              </Text>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    {review.title && (
                      <Text style={styles.reviewTitle}>{review.title}</Text>
                    )}
                    
                    {review.content && (
                      <Text style={styles.reviewContent} numberOfLines={3}>
                        {review.content}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>Be the first to share your experience!</Text>
              </View>
            )}
            
            {/* View More Button */}
            {reviews && reviews.length > 0 && (
              <View style={styles.viewMoreContainer}>
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => setShowReviewsModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewMoreButtonText}>View More</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Reviews Modal */}
      <ReviewsModal
        visible={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        reviews={reviews}
        itemRating={Number(item?.rating) || 0}
        onWriteReview={handleWriteReview}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        sortBy={sortBy}
        currentPage={currentPage}
        getPaginatedReviews={getPaginatedReviews}
        getTotalPages={getTotalPages}
      />
      </SafeAreaView>

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
        onSubmit={handleSubmitReview}
        loading={reviewsLoading}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    ...Typography.styles.button,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
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
  imageScrollView: {
    flex: 1,
  },
  imageScrollViewContent: {
    justifyContent: 'center',
  },
  image: {
    width: screenWidth - (Spacing.md * 2), // Full width of the ScrollView
    height: 280,
    borderRadius: 25,
    marginHorizontal: 0, // No margins since ScrollView handles positioning
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  placeholderImage: {
    width: screenWidth - (Spacing.md * 2),
    height: 280,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  placeholderText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: Colors.white,
  },
  pageCounterPill: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pageCounterText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.styles.h3,
    flex: 1,
    marginRight: Spacing.md,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40, // Ensure consistent width
  },
  ratingStar: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  priceText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
  },
  distanceText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    minWidth: 40, // Match rating container width
    textAlign: 'right', // Right align the text
  },
  hoursButton: {
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  hoursText: {
    ...Typography.styles.body,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  statusText: {
    fontWeight: '600',
  },
  statusOpen: {
    color: Colors.success,
  },
  statusClosed: {
    color: Colors.error,
  },
  nextChangeText: {
    color: Colors.textSecondary,
  },
  dropdownIcon: {
    color: Colors.textSecondary,
  },
  hoursDropdown: {
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dayLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 80,
  },
  addressContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addressText: {
    ...Typography.styles.body,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  orderButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25, // Pill shape like header buttons
    paddingVertical: Spacing.sm, // Reduced vertical padding
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  orderButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.98 }],
    ...Shadows.lg,
  },
  orderButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  contactButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  contactButton: {
    backgroundColor: Colors.black,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flex: 1,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    ...Shadows.sm,
  },
  contactButtonPressed: {
    backgroundColor: Colors.gray800,
    transform: [{ scale: 0.98 }],
    ...Shadows.md,
  },
  contactButtonText: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
  },
  featureTagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  featureTag: {
    borderRadius: BorderRadius['2xl'], // Match contact button shape
    paddingVertical: Spacing.sm, // Match contact button padding
    paddingHorizontal: Spacing.md, // Match contact button padding
    ...Shadows.sm,
  },
  featureTagPrimary: {
    backgroundColor: '#3B82F6', // Blue
  },
  featureTagSecondary: {
    backgroundColor: '#EF4444', // Red
  },
  featureTagAccent: {
    backgroundColor: '#F97316', // Orange
  },
  featureTagText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  tagText: {
    ...Typography.styles.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  description: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  specialCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  specialCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    flexDirection: 'column',
    alignItems: 'center',
    ...Shadows.sm,
  },
  specialCardPressed: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.primary,
    transform: [{ scale: 0.98 }],
    ...Shadows.md,
  },
  specialCardImage: {
    width: 70,
    height: 70,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  specialCardImageText: {
    fontSize: 28,
  },
  specialCardContent: {
    flex: 1,
    alignItems: 'center',
  },
  specialCardTitle: {
    ...Typography.styles.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  specialCardDescription: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 12,
    marginBottom: 1,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  // Image Header Bar Styles
  imageHeaderBar: {
    position: 'absolute',
    top: 20, // Position at the top
    alignSelf: 'center', // Center the header horizontally
    height: 40, // Reduced height to make it thinner
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassy background
    borderRadius: 20, // Adjusted border radius for thinner height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content within the header
    paddingHorizontal: Spacing.md, // Padding for content
    gap: Spacing.md, // Even spacing between elements
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerBackButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  headerBackIcon: {
    fontSize: 20,
    color: Colors.textPrimary, // Black icon
    fontWeight: 'bold',
  },
  headerText: {
    ...Typography.styles.caption,
    color: Colors.textPrimary, // Black text
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerSubText: {
    ...Typography.styles.caption,
    color: Colors.textPrimary, // Black text
    fontWeight: '400',
    letterSpacing: 1,
    opacity: 0.8,
  },
  viewCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // Small gap between eye and number
  },
  eyeIcon: {
    fontSize: 14,
    color: Colors.primary, // Blue color for eye icon
  },
  viewCount: {
    ...Typography.styles.caption,
    color: Colors.textPrimary, // Black color for numbers
    fontWeight: '600',
    fontSize: 12,
  },
  shareButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 18,
    color: Colors.textPrimary, // Black icon
    fontWeight: 'bold',
  },
  heartButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: Colors.textPrimary, // Black icon
  },
  heartIconActive: {
    color: Colors.error,
  },
  // Social Media Styles
  socialMediaContainer: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  socialMediaTitle: {
    ...Typography.styles.h4,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  socialMediaIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  socialMediaButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Long Description Styles
  longDescriptionContainer: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  longDescriptionTitle: {
    ...Typography.styles.h4,
    marginBottom: Spacing.sm,
  },
  longDescriptionText: {
    ...Typography.styles.body,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  // Reviews Section Styles
  reviewsSectionContainer: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reviewsSectionTitle: {
    ...Typography.styles.h4,
    fontFamily: 'Nunito-Bold',
    marginBottom: Spacing.xs,
  },
  writeReviewButton: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
    ...Shadows.sm,
  },
  writeReviewButtonText: {
    ...Typography.styles.button,
    color: Colors.success,
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  viewMoreContainer: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  viewMoreButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  viewMoreButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  reviewUserInitial: {
    ...Typography.styles.bodyLarge,
    color: Colors.white,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewUserName: {
    ...Typography.styles.bodyLarge,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Nunito-SemiBold',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewStar: {
    fontSize: 14,
    color: Colors.gray300,
    marginRight: 1,
  },
  reviewStarFilled: {
    color: Colors.warning,
  },
  reviewDate: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    fontFamily: 'Nunito-Regular',
  },
  reviewTitle: {
    ...Typography.styles.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    fontFamily: 'Nunito-SemiBold',
  },
  reviewContent: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  noReviewsText: {
    ...Typography.styles.h4,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: 'Nunito-Bold',
  },
  noReviewsSubtext: {
    ...Typography.styles.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  reviewItem: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    flex: 1,
  },
});

export default ListingDetailScreen;
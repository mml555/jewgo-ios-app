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
  SafeAreaView,
  FlatList,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

// Types
interface ListingDetailParams {
  itemId: string;
  categoryKey: string;
}

interface ListingItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  rating?: number;
  distance?: string;
  price?: string;
  address?: string;
  phone?: string;
  hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  images?: string[];
  reviews?: Array<{
    id: string;
    author: string;
    rating: number;
    text: string;
    date: string;
  }>;
}

const { width: screenWidth } = Dimensions.get('window');

const ListingDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId, categoryKey } = route.params as ListingDetailParams;

  const [item, setItem] = useState<ListingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showHoursDropdown, setShowHoursDropdown] = useState(false);

  // Mock data generation - replace with actual API call
  const fetchItemDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock detailed data
      const mockItem: ListingItem = {
        id: itemId,
        title: `${categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)} Item ${itemId}`,
        description: `A wonderful ${categoryKey} location with excellent service and atmosphere. This place offers a unique experience that you won't forget.`,
        imageUrl: `https://picsum.photos/seed/${categoryKey}-${itemId}/800/600`,
        category: categoryKey,
        rating: parseFloat((Math.random() * (5 - 3) + 3).toFixed(1)),
        distance: Math.random() > 0.3 ? `${(Math.random() * 10).toFixed(1)} mi` : undefined, // Simulate no location permission
        price: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
        address: '123 Main Street, City, State 12345',
        phone: '(555) 123-4567',
        hours: {
          monday: { open: '9:00 AM', close: '9:00 PM', closed: false },
          tuesday: { open: '9:00 AM', close: '9:00 PM', closed: false },
          wednesday: { open: '9:00 AM', close: '9:00 PM', closed: false },
          thursday: { open: '9:00 AM', close: '9:00 PM', closed: false },
          friday: { open: '9:00 AM', close: '10:00 PM', closed: false },
          saturday: { open: '10:00 AM', close: '10:00 PM', closed: false },
          sunday: { open: '10:00 AM', close: '8:00 PM', closed: false },
        },
        images: [
          `https://picsum.photos/seed/${categoryKey}-${itemId}-1/800/600`,
          `https://picsum.photos/seed/${categoryKey}-${itemId}-2/800/600`,
          `https://picsum.photos/seed/${categoryKey}-${itemId}-3/800/600`,
          `https://picsum.photos/seed/${categoryKey}-${itemId}-4/800/600`,
          `https://picsum.photos/seed/${categoryKey}-${itemId}-5/800/600`,
        ],
        reviews: [
          {
            id: '1',
            author: 'Sarah M.',
            rating: 5,
            text: 'Amazing experience! Great service and wonderful atmosphere. The staff was incredibly friendly and the food was outstanding.',
            date: '2024-01-15',
          },
          {
            id: '2',
            author: 'John D.',
            rating: 4,
            text: 'Really enjoyed our visit. Would definitely recommend. The ambiance was perfect for our date night.',
            date: '2024-01-10',
          },
          {
            id: '3',
            author: 'Emily R.',
            rating: 5,
            text: 'Absolutely fantastic! The quality exceeded my expectations. Will definitely be coming back soon.',
            date: '2024-01-08',
          },
          {
            id: '4',
            author: 'Mike T.',
            rating: 3,
            text: 'Good overall experience, but service was a bit slow. Food quality was decent.',
            date: '2024-01-05',
          },
          {
            id: '5',
            author: 'Lisa K.',
            rating: 4,
            text: 'Nice place with good vibes. The menu has great variety and prices are reasonable.',
            date: '2024-01-03',
          },
          {
            id: '6',
            author: 'David L.',
            rating: 5,
            text: 'Exceptional service and amazing food! This place has become our go-to spot.',
            date: '2024-01-01',
          },
          {
            id: '7',
            author: 'Anna P.',
            rating: 4,
            text: 'Great atmosphere and friendly staff. The portions are generous and everything tastes fresh.',
            date: '2023-12-28',
          },
          {
            id: '8',
            author: 'Tom W.',
            rating: 2,
            text: 'Had some issues with the order, but the manager was very helpful in resolving them.',
            date: '2023-12-25',
          },
        ],
      };

      setItem(mockItem);
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  }, [itemId, categoryKey]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  const handleBackPress = () => {
    (navigation as any).goBack();
  };

  const handleCallPress = () => {
    if (item?.phone) {
      Alert.alert('Call', `Call ${item.phone}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling:', item.phone) },
      ]);
    }
  };

  const handleDirectionsPress = () => {
    Alert.alert('Directions', 'Opening directions in Maps app...');
  };

  const handleSharePress = () => {
    Alert.alert('Share', 'Sharing item details...');
  };

  const handleFavoritePress = () => {
    setIsFavorited(!isFavorited);
  };

  const handleViewCountPress = () => {
    Alert.alert('Views', '1.2k views');
  };

  const handleRatingPress = () => {
    setShowReviewsModal(true);
  };

  const handleWriteReview = () => {
    Alert.alert('Write a Review', 'Review writing feature coming soon!');
  };

  const handleViewAllReviews = () => {
    Alert.alert('All Reviews', 'Review list feature coming soon!');
  };

  const handleHoursPress = () => {
    setShowHoursDropdown(!showHoursDropdown);
  };

  const handleOrderNowPress = () => {
    Alert.alert('Order Now', 'Ordering feature coming soon!');
  };

  const handleWebsitePress = () => {
    Alert.alert('Website', 'Website feature coming soon!');
  };

  const handleEmailPress = () => {
    Alert.alert('Email', 'Email feature coming soon!');
  };

  const getCurrentHoursStatus = () => {
    if (!item?.hours) return { status: 'Unknown', color: '#666', nextInfo: '' };
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const dayKey = currentDay === 'sun' ? 'sunday' :
                   currentDay === 'mon' ? 'monday' :
                   currentDay === 'tue' ? 'tuesday' :
                   currentDay === 'wed' ? 'wednesday' :
                   currentDay === 'thu' ? 'thursday' :
                   currentDay === 'fri' ? 'friday' : 'saturday';
    
    const todayHours = item.hours[dayKey];
    if (!todayHours || todayHours.closed) {
      // Find next opening time
      const nextOpen = getNextOpeningTime(dayKey);
      return { status: 'Closed', color: '#FF3B30', nextInfo: nextOpen };
    }
    
    // Parse opening and closing times
    const openTime = parseInt(todayHours.open.replace(/[^\d]/g, '').slice(0, 4));
    const closeTime = parseInt(todayHours.close.replace(/[^\d]/g, '').slice(0, 4));
    
    if (currentTime >= openTime && currentTime <= closeTime) {
      return { status: 'Open', color: '#34C759', nextInfo: `Closes at ${todayHours.close}` };
    } else {
      // Find next opening time
      const nextOpen = getNextOpeningTime(dayKey);
      return { status: 'Closed', color: '#FF3B30', nextInfo: nextOpen };
    }
  };

  const getNextOpeningTime = (currentDayKey: string) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentIndex = days.indexOf(currentDayKey);
    
    // Check next 7 days
    for (let i = 1; i <= 7; i++) {
      const nextIndex = (currentIndex + i) % 7;
      const nextDayKey = days[nextIndex];
      const nextDayHours = item?.hours?.[nextDayKey];
      
      if (nextDayHours && !nextDayHours.closed) {
        const dayName = nextDayKey.charAt(0).toUpperCase() + nextDayKey.slice(1);
        return `Opens ${dayName} at ${nextDayHours.open}`;
      }
    }
    
    return 'No upcoming hours';
  };

  const getSortedReviews = () => {
    if (!item?.reviews) return [];
    
    const reviews = [...item.reviews];
    switch (sortBy) {
      case 'newest':
        return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'oldest':
        return reviews.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'rating':
        return reviews.sort((a, b) => b.rating - a.rating);
      default:
        return reviews;
    }
  };

  const getPaginatedReviews = () => {
    const sortedReviews = getSortedReviews();
    const reviewsPerPage = 3;
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    return sortedReviews.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (!item?.reviews) return 0;
    return Math.ceil(item.reviews.length / 3);
  };

  const handleSortChange = (newSort: 'newest' | 'oldest' | 'rating') => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Text key={i} style={styles.starIcon}>★</Text>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Text key="half" style={styles.starIcon}>☆</Text>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Text key={`empty-${i}`} style={styles.emptyStarIcon}>☆</Text>
      );
    }

    return (
      <View style={styles.starsContainer}>
        {stars}
      </View>
    );
  };


  const renderReviews = () => {
    if (!item?.reviews || item.reviews.length === 0) return null;

    return (
      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {item.reviews.map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{review.author}</Text>
              <View style={styles.reviewRating}>
                {renderStars(review.rating)}
              </View>
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Item Not Found</Text>
          <Text style={styles.errorText}>The requested item could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Rounded Floating Image Carousel with Header Overlay */}
        <View style={styles.imageContainer}>
          <FlatList
            data={item.images || [item.imageUrl]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
              setActiveImageIndex(index);
            }}
            renderItem={({ item: imageUrl }) => (
              <Image source={{ uri: imageUrl }} style={styles.mainImage} />
            )}
            keyExtractor={(imageUrl, index) => `${imageUrl}-${index}`}
            style={styles.carousel}
          />
          
          {/* Image indicators */}
          {item.images && item.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {item.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === activeImageIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* White Rounded Header Bar Overlay */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Meat</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>ORB</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton} onPress={handleViewCountPress}>
                <Text style={styles.viewCountIcon}>👁</Text>
                <Text style={styles.viewCountText}>1.2k</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton} onPress={handleSharePress}>
                <Text style={styles.actionIcon}>↗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton} onPress={handleFavoritePress}>
                <Text style={[styles.actionIcon, isFavorited && styles.favoritedHeart]}>
                  {isFavorited ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Rating Row */}
          <View style={styles.titleRatingRow}>
            <Text style={styles.listingName}>{item.title}</Text>
            <TouchableOpacity style={styles.ratingButton} onPress={handleRatingPress}>
              <View style={styles.ratingButtonContent}>
                <Text style={styles.singleStar}>★</Text>
                <Text style={styles.ratingButtonText}>{item.rating}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Distance and Price Row */}
          <View style={styles.distancePriceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                {item.price || '$$'}
              </Text>
            </View>
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceIcon}>📍</Text>
              <Text style={styles.distanceText}>
                {item.distance || '10001'}
              </Text>
            </View>
          </View>

          {/* Hours Dropdown Button */}
          <View style={styles.hoursButtonContainer}>
            <TouchableOpacity style={styles.hoursButton} onPress={handleHoursPress}>
              <View style={styles.hoursButtonContent}>
                <Text style={styles.hoursIcon}>🕒</Text>
                <Text style={styles.hoursButtonText}>Hours:</Text>
                <Text style={[styles.hoursStatusText, { color: getCurrentHoursStatus().color }]}>
                  {getCurrentHoursStatus().status}
                </Text>
                <Text style={styles.hoursNextInfo}>{getCurrentHoursStatus().nextInfo}</Text>
                <Text style={styles.hoursDropdownIcon}>{showHoursDropdown ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Hours Dropdown Content */}
            {showHoursDropdown && (
              <View style={styles.hoursDropdown}>
                {item?.hours && Object.entries(item.hours).map(([day, hours], index, array) => (
                  <View key={day} style={[
                    styles.hoursRow,
                    index === array.length - 1 && { borderBottomWidth: 0 }
                  ]}>
                    <Text style={styles.dayLabel}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                    <Text style={styles.hoursText}>
                      {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Address */}
          {item.address && (
            <View style={styles.addressSection}>
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressText}>{item.address}</Text>
              </View>
            </View>
          )}

          {/* Order Now Button */}
          <View style={styles.orderButtonContainer}>
            <TouchableOpacity style={styles.orderButton} onPress={handleOrderNowPress}>
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactButtonsContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallPress}>
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleWebsitePress}>
              <Text style={styles.contactButtonText}>Website</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Tags */}
          <View style={styles.contentTagsContainer}>
            <View style={styles.contentTag}>
              <Text style={styles.contentTagText}>Dairy</Text>
            </View>
            <View style={styles.contentTag}>
              <Text style={styles.contentTagText}>ORB</Text>
            </View>
            <View style={styles.contentTag}>
              <Text style={styles.contentTagText}>Cholov Yisroel</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
          </View>

          {/* Divider Line */}
          <View style={styles.dividerLine} />


        </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showReviewsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviews & Ratings</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowReviewsModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Summary */}
          <View style={styles.ratingSummary}>
            <View style={styles.ratingSummaryLeft}>
              <Text style={styles.averageRating}>{item?.rating || 0}</Text>
              <View style={styles.ratingStars}>
                {renderStars(item?.rating || 0)}
              </View>
              <Text style={styles.reviewCount}>{item?.reviews?.length || 0} reviews</Text>
            </View>
            <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
              <Text style={styles.writeReviewButtonText}>Write a Review</Text>
            </TouchableOpacity>
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              {[
                { key: 'newest', label: 'Newest' },
                { key: 'oldest', label: 'Oldest' },
                { key: 'rating', label: 'Rating' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortButton,
                    sortBy === option.key && styles.sortButtonActive
                  ]}
                  onPress={() => handleSortChange(option.key as any)}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === option.key && styles.sortButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reviews List */}
          <FlatList
            data={getPaginatedReviews()}
            keyExtractor={(review) => review.id}
            renderItem={({ item: review }) => (
              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            )}
            style={styles.reviewsList}
            showsVerticalScrollIndicator={false}
          />

          {/* Pagination */}
          {getTotalPages() > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.paginationInfo}>
                Page {currentPage} of {getTotalPages()}
              </Text>
              
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === getTotalPages() && styles.paginationButtonDisabled]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === getTotalPages()}
              >
                <Text style={[styles.paginationButtonText, currentPage === getTotalPages() && styles.paginationButtonTextDisabled]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 6,
    marginLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCountIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  viewCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  carousel: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mainImage: {
    width: Dimensions.get('window').width - 32, // Full width minus margins
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: 16,
  },
  titleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listingName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 16,
  },
  ratingButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  ratingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  singleStar: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 4,
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  distancePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceContainer: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  hoursButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hoursButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 350,
    maxWidth: '90%',
  },
  hoursButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  hoursIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  hoursButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
  },
  hoursNextInfo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
    marginRight: 4,
  },
  hoursStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  hoursDropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  hoursDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 380,
    maxWidth: '95%',
  },
  addressSection: {
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  addressTextContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    alignSelf: 'center',
  },
  addressText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#00AA00',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
    numberOfLines: 3,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 40,
    marginVertical: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  actionIcon: {
    fontSize: 20,
    color: '#000',
  },
  favoritedHeart: {
    color: '#FF3B30',
  },
  addressIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  starIcon: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 2,
  },
  emptyStarIcon: {
    fontSize: 16,
    color: '#DDD',
    marginRight: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  ratingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  ratingSummaryLeft: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  writeReviewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  reviewsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reviewRating: {
    alignItems: 'flex-end',
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  paginationButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#999',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
  },
  addressSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#00AA00',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  orderButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  orderButton: {
    backgroundColor: '#00AA00',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentTagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  contentTag: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  contentTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  hoursContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dayLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    width: 90,
    marginRight: 16,
  },
  hoursText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  reviewsContainer: {
    marginBottom: 24,
  },
  reviewItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
});

export default ListingDetailScreen;

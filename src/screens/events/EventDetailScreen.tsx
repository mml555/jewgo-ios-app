import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import EventsService, { Event } from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';
import { SocialShareBar } from '../../components/events';
import ImageCarousel from '../../components/ImageCarousel';
import DetailHeaderBar from '../../components/DetailHeaderBar';
import { useFavorites } from '../../hooks/useFavorites';
import OptimizedImage from '../../components/OptimizedImage';

type RouteParams = {
  EventDetail: {
    eventId: string;
  };
};

// Memoized Related Event Item to prevent unnecessary re-renders
const RelatedEventItem = React.memo<{
  relatedEvent: any;
  navigation: any;
  formatDate: (date: string) => string;
}>(({ relatedEvent, navigation, formatDate }) => {
  const handlePress = useCallback(() => {
    navigation.navigate('EventDetail', { eventId: relatedEvent.id });
  }, [navigation, relatedEvent.id]);

  return (
    <TouchableOpacity
      style={styles.relatedEventItem}
      onPress={handlePress}
      accessibilityLabel={`View ${relatedEvent.title}`}
    >
      <OptimizedImage
        source={{ uri: relatedEvent.flyer_url }}
        style={styles.relatedEventImage}
        containerStyle={styles.relatedEventImageContainer}
        resizeMode="cover"
        showLoader={true}
        priority="low"
      />
      <View style={styles.relatedEventInfo}>
        <Text style={styles.relatedEventTitle}>{relatedEvent.title}</Text>
        <Text style={styles.relatedEventDate}>
          {formatDate(relatedEvent.event_date)}
        </Text>
        {relatedEvent.venue_name && (
          <Text style={styles.relatedEventVenue}>
            {relatedEvent.venue_name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

RelatedEventItem.displayName = 'RelatedEventItem';

const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EventDetail'>>();
  const { eventId } = route.params;
  const { isFavorited, toggleFavorite } = useFavorites();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvping, setRsvping] = useState(false);
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());

  // RSVP form
  const [guestCount, setGuestCount] = useState('1');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [notes, setNotes] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  // Add ref to track mounted state
  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const loadEvent = useCallback(async () => {
    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;

      if (isMountedRef.current) {
        setLoading(true);
      }

      console.log('🔷 EventDetailScreen: Loading event with ID:', eventId);
      const response = await EventsService.getEventById(eventId);

      // Check if aborted or unmounted
      if (newAbortController.signal.aborted || !isMountedRef.current) {
        return;
      }

      console.log(
        '🔷 EventDetailScreen: Event loaded successfully:',
        response.event?.title,
      );
      setEvent(response.event);
    } catch (error) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('❌ EventDetailScreen: Failed to load event:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to load event');
        navigation.goBack();
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [eventId, navigation]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  // Format large numbers (e.g., 1234 → 1.2K)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleShare = useCallback(async () => {
    if (event) {
      try {
        await Share.share({
          message: `Check out this event: ${event.title}`,
          url: event.cta_link || '',
        });
      } catch (error) {
        console.error('Error sharing event:', error);
      }
    }
  }, [event]);

  const handleFavorite = useCallback(() => {
    toggleFavorite(eventId);
  }, [eventId, toggleFavorite]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report Event',
      'Do you want to report this event for inappropriate content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement report functionality
            Alert.alert('Thank you', 'Your report has been submitted.');
          },
        },
      ],
    );
  }, []);

  const handleRsvp = useCallback(async () => {
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      Alert.alert('Required', 'Please enter your name and email');
      return;
    }

    try {
      if (isMountedRef.current) {
        setRsvping(true);
      }

      const response = await EventsService.rsvpToEvent(eventId, {
        guestCount: parseInt(guestCount, 10) || 1,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        notes,
        dietaryRestrictions,
      });

      // Only update UI if still mounted
      if (!isMountedRef.current) return;

      if (response.waitlisted) {
        Alert.alert('Waitlisted', response.message || 'Added to waitlist');
      } else {
        Alert.alert('Success', 'RSVP confirmed!');
      }

      setShowRsvpModal(false);
      loadEvent();
    } catch (error: any) {
      if (isMountedRef.current) {
        Alert.alert('Error', error.message || 'Failed to RSVP');
      }
    } finally {
      if (isMountedRef.current) {
        setRsvping(false);
      }
    }
  }, [
    attendeeName,
    attendeeEmail,
    eventId,
    guestCount,
    attendeePhone,
    notes,
    dietaryRestrictions,
    loadEvent,
  ]);

  const handleCancelRsvp = useCallback(async () => {
    Alert.alert('Cancel RSVP', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await EventsService.cancelRsvp(eventId);

            // Only update UI if still mounted
            if (!isMountedRef.current) return;

            Alert.alert('Success', 'RSVP cancelled');
            loadEvent();
          } catch (error: any) {
            if (isMountedRef.current) {
              Alert.alert('Error', error.message);
            }
          }
        },
      },
    ]);
  }, [eventId, loadEvent]);

  const formatDateShort = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Memoize expensive calculations - MUST be before early returns!
  const capacityPercentage = useMemo(() => {
    return event?.capacity
      ? Math.round((event.rsvp_count / event.capacity) * 100)
      : 0;
  }, [event?.capacity, event?.rsvp_count]);

  const isFull = useMemo(() => {
    return !!(event?.capacity && event && event.rsvp_count >= event.capacity);
  }, [event?.capacity, event?.rsvp_count]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#74E1A0" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar - Reusable Component */}
      <DetailHeaderBar
        pressedButtons={pressedButtons}
        handlePressIn={handlePressIn}
        handlePressOut={handlePressOut}
        formatCount={formatCount}
        onReportPress={handleReport}
        onSharePress={handleShare}
        onFavoritePress={handleFavorite}
        centerContent={{
          type: 'view_count',
          count: event.view_count || 0,
        }}
        rightContent={{
          type: 'share_favorite',
          shareCount: event.share_count || 0,
          likeCount: event.like_count || 0,
          isFavorited: isFavorited(eventId),
        }}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Hero Image Carousel */}
        <View style={styles.carouselContainer}>
          <ImageCarousel
            images={event.flyer_url ? [event.flyer_url] : []}
            fallbackImageUrl={event.flyer_url}
            height={400}
            borderRadius={20}
          />
        </View>

        {/* Event Info Card */}
        <View style={styles.eventInfoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.zipCode}>{event.zip_code}</Text>
          </View>

          <Text style={styles.date}>{formatDateShort(event.event_date)}</Text>

          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {event.is_free ? 'Free' : 'Paid'}
            </Text>
          </View>
        </View>

        {/* Primary CTA Buttons */}
        {event.has_rsvped ? (
          <View style={styles.ctaButtonsWrapper}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRsvp}
              accessibilityLabel="Cancel RSVP"
            >
              <Text style={styles.cancelButtonText}>Cancel RSVP</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {event.cta_link && (
              <View style={styles.ctaButtonsWrapper}>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => Linking.openURL(event.cta_link!)}
                  accessibilityLabel="Event Info"
                >
                  <Text style={styles.ctaButtonText}>Event Info</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.ctaButtonsWrapper}>
              <TouchableOpacity
                style={[styles.ctaButton, isFull && styles.ctaButtonDisabled]}
                onPress={() => setShowRsvpModal(true)}
                disabled={isFull}
                accessibilityLabel={isFull ? 'Event Full' : 'Reserve Now'}
              >
                <Text style={styles.ctaButtonText}>
                  {isFull ? 'Event Full' : 'Reserve Now!'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailText}>
              {event.display_date_range_formatted ||
                `${formatDate(event.event_date)} ${formatTime(
                  event.event_date,
                )}`}
            </Text>
          </View>

          {event.venue_name && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Address:</Text>
              <TouchableOpacity
                onPress={() => {
                  if (event.latitude && event.longitude) {
                    const url = `maps://maps.google.com/maps?daddr=${event.latitude},${event.longitude}`;
                    Linking.openURL(url);
                  }
                }}
                accessibilityLabel="Open in Maps"
                accessibilityHint="Opens the event location in Maps app"
              >
                <Text style={[styles.detailText, styles.linkText]}>
                  {event.venue_name}
                  {event.address && `, ${event.address}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {event.capacity && (
            <View style={styles.capacityContainer}>
              <View style={styles.capacityHeader}>
                <Text style={styles.capacityLabel}>Capacity</Text>
                <Text style={styles.capacityCount}>
                  {event.rsvp_count}/{event.capacity}
                </Text>
              </View>
              <View style={styles.capacityBar}>
                <View
                  style={[
                    styles.capacityProgress,
                    { width: `${Math.min(capacityPercentage, 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* About Event Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About Event</Text>
          <Text style={styles.sectionText}>{event.description}</Text>
        </View>

        {/* Host Section */}
        {event.host && (
          <View style={styles.hostSection}>
            <Text style={styles.sectionTitle}>Host</Text>
            <Text style={styles.sectionText}>{event.host}</Text>
          </View>
        )}

        {/* Related Events */}
        {event.related_events && event.related_events.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>Related Events</Text>
            {event.related_events.slice(0, 3).map(relatedEvent => (
              <RelatedEventItem
                key={relatedEvent.id}
                relatedEvent={relatedEvent}
                navigation={navigation}
                formatDate={formatDate}
              />
            ))}
          </View>
        )}

        {/* Social Share Bar */}
        <SocialShareBar
          event={event}
          onShare={platform => EventsService.shareEvent(event, platform as any)}
        />
      </ScrollView>

      <Modal
        visible={showRsvpModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRsvpModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>RSVP</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Number of Guests *</Text>
              <TextInput
                style={styles.input}
                value={guestCount}
                onChangeText={setGuestCount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={styles.input}
                value={attendeeName}
                onChangeText={setAttendeeName}
                placeholder="John Doe"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={attendeeEmail}
                onChangeText={setAttendeeEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={attendeePhone}
                onChangeText={setAttendeePhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dietary Restrictions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={dietaryRestrictions}
                onChangeText={setDietaryRestrictions}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                rsvping && styles.submitButtonDisabled,
              ]}
              onPress={handleRsvp}
              disabled={rsvping}
            >
              {rsvping ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Confirm RSVP</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  carouselContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.xl,
  },
  eventInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292B2D',
    flex: 1,
    marginRight: Spacing.md,
  },
  zipCode: {
    fontSize: 16,
    color: '#00B8A9', // Teal color from design
    fontWeight: '600',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: Spacing.sm,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#74E1A0', // Mint green for free
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ctaButtonsWrapper: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButton: {
    backgroundColor: '#1E7A5F', // Primary green from design
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailSection: {
    marginBottom: Spacing.md,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E7A5F',
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontSize: 16,
    color: '#292B2D',
    lineHeight: 22,
  },
  linkText: {
    color: '#00B8A9',
    textDecorationLine: 'underline',
  },
  capacityContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292B2D',
  },
  capacityCount: {
    fontSize: 14,
    color: '#666',
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityProgress: {
    height: '100%',
    backgroundColor: '#74E1A0',
  },
  aboutSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hostSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relatedSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E7A5F',
    marginBottom: Spacing.md,
  },
  sectionText: {
    fontSize: 16,
    color: '#292B2D',
    lineHeight: 24,
  },
  relatedEventItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  relatedEventImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: Spacing.md,
    backgroundColor: '#F1F1F1',
  },
  relatedEventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  relatedEventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: 4,
  },
  relatedEventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  relatedEventVenue: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalClose: {
    fontSize: 28,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
  },
  formGroup: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default EventDetailScreen;

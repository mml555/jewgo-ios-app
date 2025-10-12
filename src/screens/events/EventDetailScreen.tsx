import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import EventsService, { Event } from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';
import { SocialShareBar } from '../../components/events';

type RouteParams = {
  EventDetail: {
    eventId: string;
  };
};

const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EventDetail'>>();
  const insets = useSafeAreaInsets();
  const { eventId } = route.params;

  console.log('🔷 EventDetailScreen mounted with eventId:', eventId);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvping, setRsvping] = useState(false);

  // RSVP form
  const [guestCount, setGuestCount] = useState('1');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [notes, setNotes] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      console.log('🔷 EventDetailScreen: Loading event with ID:', eventId);
      const response = await EventsService.getEventById(eventId);
      console.log('🔷 EventDetailScreen: Event loaded successfully:', response.event?.title);
      setEvent(response.event);
    } catch (error) {
      console.error('❌ EventDetailScreen: Failed to load event:', error);
      Alert.alert('Error', 'Failed to load event');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async () => {
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      Alert.alert('Required', 'Please enter your name and email');
      return;
    }

    try {
      setRsvping(true);
      const response = await EventsService.rsvpToEvent(eventId, {
        guestCount: parseInt(guestCount, 10) || 1,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        notes,
        dietaryRestrictions,
      });

      if (response.waitlisted) {
        Alert.alert('Waitlisted', response.message || 'Added to waitlist');
      } else {
        Alert.alert('Success', 'RSVP confirmed!');
      }

      setShowRsvpModal(false);
      loadEvent();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to RSVP');
    } finally {
      setRsvping(false);
    }
  };

  const handleCancelRsvp = async () => {
    Alert.alert('Cancel RSVP', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await EventsService.cancelRsvp(eventId);
            Alert.alert('Success', 'RSVP cancelled');
            loadEvent();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#74E1A0" />
      </View>
    );
  }

  if (!event) return null;

  const capacityPercentage = event.capacity
    ? Math.round((event.rsvp_count / event.capacity) * 100)
    : 0;
  const isFull = !!(event.capacity && event.rsvp_count >= event.capacity);

  return (
    <View style={styles.container}>
      {/* Hero Image with Overlay Actions */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: event.flyer_url }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        
        {/* Overlay Action Bar */}
        <View style={[styles.overlayActionBar, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          >
            <Text style={styles.overlayButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.overlayStats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👁️</Text>
              <Text style={styles.statText}>{event.view_count || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>↗️</Text>
              <Text style={styles.statText}>{event.share_count || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statText}>{event.like_count || 0}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.overlayButton}
            onPress={() => {/* TODO: Implement flag functionality */}}
            accessibilityLabel="Flag event"
          >
            <Text style={styles.overlayButtonText}>🚩</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
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
        <View style={styles.ctaContainer}>
          {event.has_rsvped ? (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRsvp}
              accessibilityLabel="Cancel RSVP"
            >
              <Text style={styles.cancelButtonText}>Cancel RSVP</Text>
            </TouchableOpacity>
          ) : (
            <>
              {event.cta_link && (
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => Linking.openURL(event.cta_link!)}
                  accessibilityLabel="Event Info"
                >
                  <Text style={styles.ctaButtonText}>Event Info</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  isFull && styles.ctaButtonDisabled,
                  event.cta_link && styles.ctaButtonSecondary
                ]}
                onPress={() => setShowRsvpModal(true)}
                disabled={isFull}
                accessibilityLabel={isFull ? 'Event Full' : 'Reserve Now'}
              >
                <Text style={styles.ctaButtonText}>
                  {isFull ? 'Event Full' : 'Reserve Now!'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailText}>
              {event.display_date_range_formatted || 
               `${formatDate(event.event_date)} ${formatTime(event.event_date)}`}
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
            {event.related_events.map((relatedEvent) => (
              <TouchableOpacity
                key={relatedEvent.id}
                style={styles.relatedEventItem}
                onPress={() => navigation.navigate('EventDetail', { eventId: relatedEvent.id })}
                accessibilityLabel={`View ${relatedEvent.title}`}
              >
                <Image
                  source={{ uri: relatedEvent.flyer_url }}
                  style={styles.relatedEventImage}
                  resizeMode="cover"
                />
                <View style={styles.relatedEventInfo}>
                  <Text style={styles.relatedEventTitle}>{relatedEvent.title}</Text>
                  <Text style={styles.relatedEventDate}>
                    {formatDate(relatedEvent.event_date)}
                  </Text>
                  {relatedEvent.venue_name && (
                    <Text style={styles.relatedEventVenue}>{relatedEvent.venue_name}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Social Share Bar */}
      <SocialShareBar
        event={event}
        onShare={(platform) => EventsService.shareEvent(event, platform as any)}
      />

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        {!event.has_rsvped && (
          <TouchableOpacity
            style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
            onPress={() => setShowRsvpModal(true)}
            disabled={isFull}
            accessibilityLabel={isFull ? 'Event Full' : 'Join us!'}
          >
            <Text style={styles.joinButtonText}>
              {isFull ? 'Event Full' : 'Join us!'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showRsvpModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
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
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F2F2F7' 
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  heroContainer: {
    position: 'relative',
    height: 400,
  },
  heroImage: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#F1F1F1' 
  },
  overlayActionBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayButtonText: {
    fontSize: 20,
    color: '#292B2D',
    fontWeight: 'bold',
  },
  overlayStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  eventInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
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
  ctaContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    backgroundColor: '#1E7A5F', // Primary green from design
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ctaButtonSecondary: {
    marginTop: Spacing.md,
  },
  ctaButtonDisabled: { 
    opacity: 0.5 
  },
  ctaButtonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
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
    color: '#292B2D' 
  },
  capacityCount: { 
    fontSize: 14, 
    color: '#666' 
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityProgress: { 
    height: '100%', 
    backgroundColor: '#74E1A0' 
  },
  aboutSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  hostSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  relatedSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
    lineHeight: 24 
  },
  relatedEventItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  relatedEventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.md,
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
  actionBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  joinButton: {
    backgroundColor: '#1E7A5F',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  joinButtonDisabled: { 
    opacity: 0.5 
  },
  joinButtonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
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
    color: '#FFFFFF' 
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#F2F2F7' 
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
    color: '#666' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#292B2D' 
  },
  modalContent: { 
    flex: 1, 
    padding: Spacing.lg 
  },
  formGroup: { 
    marginBottom: Spacing.lg 
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
    textAlignVertical: 'top' 
  },
  submitButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: { 
    opacity: 0.6 
  },
  submitButtonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
});

export default EventDetailScreen;

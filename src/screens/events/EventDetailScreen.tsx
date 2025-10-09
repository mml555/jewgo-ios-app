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
      const response = await EventsService.getEventById(eventId);
      setEvent(response.event);
    } catch (error) {
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
      <ScrollView>
        <Image
          source={{ uri: event.flyer_url }}
          style={styles.flyerImage}
          resizeMode="contain"
        />

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeRow}>
              <Text style={styles.icon}>📅</Text>
              <Text style={styles.dateTimeText}>
                {formatDate(event.event_date)}
              </Text>
            </View>
            <View style={styles.dateTimeRow}>
              <Text style={styles.icon}>🕐</Text>
              <Text style={styles.dateTimeText}>
                {formatTime(event.event_date)}
              </Text>
            </View>
          </View>

          {event.venue_name && (
            <View style={styles.locationContainer}>
              <Text style={styles.icon}>📍</Text>
              <View>
                <Text style={styles.venueName}>{event.venue_name}</Text>
                {event.address && (
                  <Text style={styles.address}>{event.address}</Text>
                )}
              </View>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionText}>{event.description}</Text>
          </View>

          {event.host && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Host</Text>
              <Text style={styles.sectionText}>{event.host}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        {event.has_rsvped ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRsvp}
          >
            <Text style={styles.cancelButtonText}>Cancel RSVP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.rsvpButton, isFull && styles.rsvpButtonDisabled]}
            onPress={() => setShowRsvpModal(true)}
            disabled={isFull}
          >
            <Text style={styles.rsvpButtonText}>
              {isFull ? 'Event Full' : 'RSVP Now'}
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flyerImage: { width: '100%', height: 500, backgroundColor: '#F1F1F1' },
  content: { backgroundColor: '#FFFFFF', padding: Spacing.lg },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.md,
  },
  dateTimeContainer: { marginBottom: Spacing.md },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: { fontSize: 18, marginRight: Spacing.sm },
  dateTimeText: { fontSize: 16, color: '#666' },
  locationContainer: { flexDirection: 'row', marginBottom: Spacing.md },
  venueName: { fontSize: 16, fontWeight: '600', color: '#292B2D' },
  address: { fontSize: 14, color: '#666', marginTop: 4 },
  capacityContainer: {
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  capacityLabel: { fontSize: 14, fontWeight: '600', color: '#292B2D' },
  capacityCount: { fontSize: 14, color: '#666' },
  capacityBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityProgress: { height: '100%', backgroundColor: '#74E1A0' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  sectionText: { fontSize: 16, color: '#666', lineHeight: 24 },
  actionBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  rsvpButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  rsvpButtonDisabled: { opacity: 0.5 },
  rsvpButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7' },
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
  modalClose: { fontSize: 28, color: '#666' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#292B2D' },
  modalContent: { flex: 1, padding: Spacing.lg },
  formGroup: { marginBottom: Spacing.lg },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});

export default EventDetailScreen;

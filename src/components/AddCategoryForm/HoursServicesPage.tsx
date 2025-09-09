import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';

interface HoursServicesPageProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  category: string;
}

const HoursServicesPage: React.FC<HoursServicesPageProps> = ({
  formData,
  onFormDataChange,
  category,
}) => {
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00', '23:30', '00:00',
  ];

  const handleDayToggle = useCallback((dayKey: string) => {
    const currentHours = formData.hours || {};
    const dayHours = currentHours[dayKey] || { open: '09:00', close: '17:00', closed: false };
    
    onFormDataChange({
      hours: {
        ...currentHours,
        [dayKey]: {
          ...dayHours,
          closed: !dayHours.closed,
        },
      },
    });
  }, [formData.hours, onFormDataChange]);

  const handleTimeChange = useCallback((dayKey: string, timeType: 'open' | 'close', time: string) => {
    const currentHours = formData.hours || {};
    const dayHours = currentHours[dayKey] || { open: '09:00', close: '17:00', closed: false };
    
    onFormDataChange({
      hours: {
        ...currentHours,
        [dayKey]: {
          ...dayHours,
          [timeType]: time,
        },
      },
    });
  }, [formData.hours, onFormDataChange]);

  const handleAmenityToggle = useCallback((amenityKey: string) => {
    const currentAmenities = formData.amenities || {};
    onFormDataChange({
      amenities: {
        ...currentAmenities,
        [amenityKey]: !currentAmenities[amenityKey],
      },
    });
  }, [formData.amenities, onFormDataChange]);

  const formatTime = useCallback((time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }, []);

  const renderTimePicker = (dayKey: string, timeType: 'open' | 'close') => {
    if (showTimePicker !== `${dayKey}-${timeType}`) return null;

    const currentTime = formData.hours?.[dayKey]?.[timeType] || '09:00';

    return (
      <View style={styles.timePickerContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                currentTime === time && styles.timeSlotActive,
              ]}
              onPress={() => {
                handleTimeChange(dayKey, timeType, time);
                setShowTimePicker(null);
              }}
            >
              <Text style={[
                styles.timeSlotText,
                currentTime === time && styles.timeSlotTextActive,
              ]}>
                {formatTime(time)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerEmoji}>🕒</Text>
        <Text style={styles.headerTitle}>Hours & Services</Text>
        <Text style={styles.headerSubtitle}>
          Set your operating hours and available amenities
        </Text>
      </View>

      {/* Operating Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operating Hours</Text>
        <Text style={styles.sectionSubtitle}>
          Tap on times to change them, or toggle days closed
        </Text>
        
        <View style={styles.hoursContainer}>
          {days.map((day) => {
            const dayHours = formData.hours?.[day.key] || { open: '09:00', close: '17:00', closed: false };
            
            return (
              <View key={day.key} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayLabel}>{day.label}</Text>
                  <Switch
                    value={!dayHours.closed}
                    onValueChange={() => handleDayToggle(day.key)}
                    trackColor={{ false: '#E5E5EA', true: '#74e1a0' }}
                    thumbColor="#FFFFFF"
                    style={styles.daySwitch}
                  />
                </View>
                
                {!dayHours.closed && (
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker(`${day.key}-open`)}
                    >
                      <Text style={styles.timeButtonText}>
                        {formatTime(dayHours.open)}
                      </Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.timeSeparator}>to</Text>
                    
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker(`${day.key}-close`)}
                    >
                      <Text style={styles.timeButtonText}>
                        {formatTime(dayHours.close)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {dayHours.closed && (
                  <Text style={styles.closedText}>Closed</Text>
                )}
                
                {renderTimePicker(day.key, 'open')}
                {renderTimePicker(day.key, 'close')}
              </View>
            );
          })}
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities & Services</Text>
        <Text style={styles.sectionSubtitle}>
          Select all amenities you offer
        </Text>
        
        <View style={styles.amenitiesGrid}>
          {[
            { key: 'hasParking', label: 'Parking Available', emoji: '🅿️' },
            { key: 'hasWifi', label: 'Free WiFi', emoji: '📶' },
            { key: 'hasAccessibility', label: 'Wheelchair Accessible', emoji: '♿' },
            { key: 'hasDelivery', label: 'Delivery Available', emoji: '🚚' },
            { key: 'hasTakeout', label: 'Takeout Available', emoji: '🥡' },
            { key: 'hasOutdoorSeating', label: 'Outdoor Seating', emoji: '🌳' },
          ].map((amenity) => (
            <TouchableOpacity
              key={amenity.key}
              style={[
                styles.amenityButton,
                formData.amenities?.[amenity.key] && styles.amenityButtonActive,
              ]}
              onPress={() => handleAmenityToggle(amenity.key)}
            >
              <Text style={styles.amenityEmoji}>{amenity.emoji}</Text>
              <Text style={[
                styles.amenityLabel,
                formData.amenities?.[amenity.key] && styles.amenityLabelActive,
              ]}>
                {amenity.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Hours & Services Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Be accurate with your hours - customers rely on this info
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Consider Shabbat hours for Friday/Saturday
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Highlight amenities that make you stand out
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
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
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
    marginBottom: 12,
  },
  hoursContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    minWidth: 80,
  },
  daySwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  timeButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  timeSeparator: {
    fontSize: 12,
    color: '#8E8E93',
    marginHorizontal: 6,
  },
  closedText: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'right',
    fontWeight: '500',
    flex: 1,
  },
  timePickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 6,
  },
  timePicker: {
    maxHeight: 80,
  },
  timeSlot: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  timeSlotActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  amenityButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  amenityEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  amenityLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  amenityLabelActive: {
    color: '#FFFFFF',
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

export default HoursServicesPage;

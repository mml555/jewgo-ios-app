import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RatingBadge } from './markers/RatingBadge';

/**
 * Test component to verify marker designs match reference specifications
 * This component can be temporarily added to any screen for visual testing
 */
export function MarkerDesignTest() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Marker Design Test</Text>

      {/* Rating Badge Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rating Badges</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Blue (≥4.7):</Text>
          <RatingBadge rating={4.8} color="#66B7FF" />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Yellow (≥4.0):</Text>
          <RatingBadge rating={4.2} color="#FFC44D" />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Red (&lt;4.0):</Text>
          <RatingBadge rating={3.5} color="#FF6B6B" />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Unknown:</Text>
          <RatingBadge rating={null} color="#FF6B6B" />
        </View>
      </View>

      {/* Selected State Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected States</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Selected Blue:</Text>
          <RatingBadge rating={4.8} color="#66B7FF" selected />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Selected Yellow:</Text>
          <RatingBadge rating={4.2} color="#FFC44D" selected />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Selected Red:</Text>
          <RatingBadge rating={3.5} color="#FF6B6B" selected />
        </View>
      </View>

      {/* Design Specifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design Specifications</Text>
        <Text style={styles.spec}>
          • Pill: White background, 18dp radius, H12/V8 padding{'\n'}• Tail:
          16×16dp, rotated 45°, 3dp radius, 8dp overlap{'\n'}• Typography: 14dp,
          700 weight, 0.2 letter spacing{'\n'}• Colors: Blue #66B7FF (≥4.7),
          Yellow #FFC44D (≥4.0), Red #FF6B6B (&lt;4.0){'\n'}• Shadow: 26×10dp
          ellipse, rgba(0,0,0,0.18), +7dp offset{'\n'}• States: Default 1.0×,
          Selected 1.05×, Pressed 0.98×
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    minWidth: 120,
  },
  spec: {
    fontSize: 12,
    lineHeight: 18,
    color: '#666',
    fontFamily: 'monospace',
  },
});

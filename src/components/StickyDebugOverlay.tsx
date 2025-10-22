import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../styles/designSystem';

interface StickyDebugOverlayProps {
  SAFE_TOP: number;
  SEARCH_H: number;
  LANE_GAP: number;
  railHeight: number;
  ACTION_H: number;
  LANE_B_H: number;
  STICKY_H: number;
  THRESHOLD_Y: number;
  bannerHeight: number;
  scrollY: number;
  stickyHeightMeasured: number;
  flatListPaddingTop: number;
  stickyOverlayHeight?: number;
  paddingExtra?: number;
}

/**
 * Debug overlay to verify sticky header measurements
 * Enable this component in __DEV__ mode to see live measurements
 */
const StickyDebugOverlay: React.FC<StickyDebugOverlayProps> = ({
  SAFE_TOP,
  SEARCH_H,
  LANE_GAP,
  railHeight,
  ACTION_H,
  LANE_B_H,
  STICKY_H,
  THRESHOLD_Y,
  bannerHeight: _bannerHeight,
  scrollY,
  stickyHeightMeasured,
  flatListPaddingTop,
  stickyOverlayHeight = STICKY_H,
  paddingExtra = 0,
}) => {
  if (!__DEV__) {
    return null;
  }

  const expectedSticky = SEARCH_H + LANE_GAP + ACTION_H;
  const expectedPadding = SEARCH_H + LANE_GAP + paddingExtra;
  const paddingDelta = flatListPaddingTop - expectedPadding;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>Sticky Header Debug</Text>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>SAFE_TOP:</Text>
          <Text style={styles.debugValue}>{SAFE_TOP}px</Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>SEARCH_H:</Text>
          <Text style={styles.debugValue}>{SEARCH_H}px</Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>LANE_GAP:</Text>
          <Text style={styles.debugValue}>{LANE_GAP}px</Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>railHeight:</Text>
          <Text style={styles.debugValue}>{railHeight}px</Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>LANE_B_H:</Text>
          <Text style={styles.debugValue}>
            {LANE_B_H}px (max of {railHeight}, {ACTION_H})
          </Text>
        </View>

        <View style={[styles.debugRow, styles.debugRowHighlight]}>
          <Text style={[styles.debugLabel, styles.debugLabelHighlight]}>
            STICKY_H:
          </Text>
          <Text style={[styles.debugValue, styles.debugValueHighlight]}>
            {stickyOverlayHeight}px
          </Text>
        </View>

        <View style={[styles.debugRow, styles.debugRowCalculation]}>
          <Text style={[styles.debugLabel, styles.debugLabelCalculation]}>
            CALC:
          </Text>
          <Text style={[styles.debugValue, styles.debugValueCalculation]}>
            {expectedSticky}px
          </Text>
        </View>

        <View style={[styles.debugRow, styles.debugRowMeasured]}>
          <Text style={[styles.debugLabel, styles.debugLabelMeasured]}>
            HEADER_H:
          </Text>
          <Text style={[styles.debugValue, styles.debugValueMeasured]}>
            {stickyHeightMeasured}px (headerH)
          </Text>
        </View>

        <View style={[styles.debugRow, styles.debugRowPadding]}>
          <Text style={[styles.debugLabel, styles.debugLabelPadding]}>
            PADDING:
          </Text>
          <Text style={[styles.debugValue, styles.debugValuePadding]}>
            {flatListPaddingTop}px (FlatList paddingTop)
          </Text>
        </View>

        {paddingExtra !== 0 && (
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>extraInset:</Text>
            <Text style={styles.debugValue}>{paddingExtra}px</Text>
          </View>
        )}

        <View style={[styles.debugRow, styles.debugRowDelta]}>
          <Text style={[styles.debugLabel, styles.debugLabelDelta]}>Δ:</Text>
          <Text
            style={[
              styles.debugValue,
              Math.abs(paddingDelta) > 5
                ? styles.debugValueError
                : styles.debugValueSuccess,
            ]}
          >
            {paddingDelta}px
          </Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>THRESHOLD_Y:</Text>
          <Text style={styles.debugValue}>{THRESHOLD_Y}px</Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>scrollY:</Text>
          <Text style={styles.debugValue}>{scrollY.toFixed(1)}px</Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Lane B shows:</Text>
          <Text style={[styles.debugValue, styles.debugValueActive]}>
            ActionBar (always)
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 9999,
  },
  debugPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: Colors.primary.light,
  },
  debugTitle: {
    color: Colors.primary.light,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  debugRowHighlight: {
    backgroundColor: 'rgba(116, 225, 160, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  debugLabel: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '500',
  },
  debugLabelHighlight: {
    color: Colors.primary.light,
    fontWeight: '700',
  },
  debugValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugValueHighlight: {
    color: Colors.primary.light,
    fontWeight: '700',
  },
  debugValueActive: {
    color: '#FFD700',
  },
  debugRowCalculation: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  debugLabelCalculation: {
    color: '#FFA500',
    fontWeight: '700',
  },
  debugValueCalculation: {
    color: '#FFA500',
    fontWeight: '700',
  },
  debugRowMeasured: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  debugLabelMeasured: {
    color: '#00FFFF',
    fontWeight: '700',
  },
  debugValueMeasured: {
    color: '#00FFFF',
    fontWeight: '700',
  },
  debugRowPadding: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  debugLabelPadding: {
    color: '#FF00FF',
    fontWeight: '700',
  },
  debugValuePadding: {
    color: '#FF00FF',
    fontWeight: '700',
  },
  debugRowDelta: {
    backgroundColor: 'rgba(255, 255, 0, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  debugLabelDelta: {
    color: '#FFFF00',
    fontWeight: '700',
  },
  debugValueDelta: {
    color: '#FFFF00',
    fontWeight: '700',
  },
  debugValueError: {
    color: '#FF0000',
    fontWeight: '700',
  },
  debugValueSuccess: {
    color: '#00FF00',
    fontWeight: '700',
  },
});

export default StickyDebugOverlay;

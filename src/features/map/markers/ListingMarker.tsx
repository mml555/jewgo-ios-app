import React, { useState, useEffect, memo } from 'react';
import { Marker } from 'react-native-maps';
import { RatingBadge } from './RatingBadge';
import { ClusterNode } from '../types';

interface ListingMarkerProps {
  node: ClusterNode;
  selected?: boolean;
  onPress?: () => void;
}

function getRatingColor(rating: number | null): string {
  if (rating == null) {
    return '#FF6B6B';
  } // Red for unknown/null ratings
  if (rating >= 4.7) {
    return '#66B7FF';
  } // Blue for excellent ratings (≥4.7)
  if (rating >= 4.0) {
    return '#FFC44D';
  } // Yellow for good ratings (≥4.0)
  return '#FF6B6B'; // Red for poor ratings (<4.0)
}

export const ListingMarker = memo(function ListingMarker({
  node,
  selected = false,
  onPress,
}: ListingMarkerProps) {
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFrozen(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const [lng, lat] = node.geometry.coordinates;
  const { rating } = node.properties;
  const color = getRatingColor(rating);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={!frozen}
      zIndex={selected ? 999 : 10}
      onPress={e => {
        e?.stopPropagation?.();
        onPress?.();
      }}
    >
      <RatingBadge rating={rating} color={color} selected={selected} />
    </Marker>
  );
});

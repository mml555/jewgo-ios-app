import React, { useState, useEffect, memo } from 'react';
import { Marker } from 'react-native-maps';
import { RatingBadge } from './RatingBadge';
import { MapPoint } from '../types';
import { getDietaryColor } from '../../../utils/eateryHelpers';

interface ListingMarkerProps {
  point: MapPoint;
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
  point,
  selected = false,
  onPress,
}: ListingMarkerProps) {
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFrozen(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const { latitude, longitude, rating, kosher_level } = point;
  
  // Debug logging
  if (__DEV__) {
    console.log('🔍 ListingMarker Debug:', {
      id: point.id,
      title: point.title,
      selected,
      kosher_level,
      rating,
      selectedId: selected ? 'SELECTED' : 'NOT_SELECTED',
    });
  }
  
  // Use kosher level color only when selected, otherwise use rating color
  const color = selected && kosher_level 
    ? getDietaryColor(kosher_level)
    : getRatingColor(rating);
    
  if (__DEV__) {
    console.log('🔍 Color decision:', {
      selected,
      kosher_level,
      finalColor: color,
      dietaryColor: kosher_level ? getDietaryColor(kosher_level) : 'N/A',
      ratingColor: getRatingColor(rating),
      category: point.category,
    });
  }

  return (
    <Marker
      coordinate={{ latitude, longitude }}
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

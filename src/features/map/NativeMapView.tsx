import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useMapDimensions } from './hooks/useMapDimensions';
import { useStableCallback } from './hooks/useStableCallback';
import { ListingMarker } from './markers/ListingMarker';
import { MapPoint } from './types';
import { debugLog } from '../../utils/logger';
import { isSameRegion } from './utils/zoomUtils';

interface NativeMapViewProps {
  points?: MapPoint[];
  initialRegion?: Region;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  onMarkerPress?: (point: MapPoint) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCenterLocation?: () => void;
}

export interface NativeMapViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  centerOnLocation: () => void;
  animateToRegion: (region: Region, duration?: number) => void;
}

export const NativeMapView = forwardRef<NativeMapViewRef, NativeMapViewProps>(
  (
    {
      points = [],
      initialRegion,
      userLocation,
      selectedId,
      onMarkerPress,
      onZoomIn,
      onZoomOut,
      onCenterLocation,
    },
    ref,
  ) => {
    const mapRef = useRef<MapView>(null);
    const { dimensions, onLayout, hasDimensions } = useMapDimensions();
    const [region, setRegion] = useState<Region>(
      initialRegion || {
        latitude: 40.7128,
        longitude: -74.006,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
    );

    // Simple debug logging
    React.useEffect(() => {
      if (__DEV__) {
        console.log('🔍 Map points:', {
          count: points.length,
          region: {
            lat: region.latitude,
            lng: region.longitude,
            latDelta: region.latitudeDelta,
            lngDelta: region.longitudeDelta,
          },
        });
      }
    }, [points.length, region]);

    // Safety check
    if (!initialRegion) {
      debugLog('⚠️ NativeMapView: No initialRegion provided, using default');
    }

    // Simple debug logging for performance
    React.useEffect(() => {
      if (__DEV__ && points.length > 0) {
        debugLog('🗺️ NativeMapView:', {
          pointsCount: points.length,
        });
      }
    }, [points.length]);

    // Cleanup debounce timeout on unmount to prevent state updates after unmount
    React.useEffect(() => {
      return () => {
        if (debouncedUpdate.current) {
          clearTimeout(debouncedUpdate.current);
          debouncedUpdate.current = null;
        }
      };
    }, []);

    // Debounced region change to prevent thrashing
    const debouncedUpdate = useRef<NodeJS.Timeout | null>(null);

    const handleRegionChangeComplete = useStableCallback((newRegion: Region) => {
      if (isSameRegion(region, newRegion)) return;
      
      if (debouncedUpdate.current) {
        clearTimeout(debouncedUpdate.current);
      }
      
      debouncedUpdate.current = setTimeout(
        () => setRegion(newRegion),
        120 // Simple debounce
      );
    });


    const handleMarkerPress = useCallback(
      (point: MapPoint) => {
        console.log('🔍 Marker press:', {
          id: point.id,
          title: point.title,
          coordinates: { lat: point.latitude, lng: point.longitude },
          hasOnMarkerPress: !!onMarkerPress,
        });

        if (onMarkerPress) {
          console.log('🔍 Calling onMarkerPress with point');
          onMarkerPress(point);
        } else {
          console.log('🔍 No onMarkerPress handler provided');
        }
      },
      [onMarkerPress],
    );

    // Zoom controls
    const handleZoomIn = useCallback(() => {
      if (mapRef.current) {
        const newRegion = {
          ...region,
          latitudeDelta: region.latitudeDelta * 0.5,
          longitudeDelta: region.longitudeDelta * 0.5,
        };
        mapRef.current.animateToRegion(newRegion, 300);
        // Don't call onZoomIn to avoid infinite loop with ref pattern
      }
    }, [region]);

    const handleZoomOut = useCallback(() => {
      if (mapRef.current) {
        const newRegion = {
          ...region,
          latitudeDelta: region.latitudeDelta * 2,
          longitudeDelta: region.longitudeDelta * 2,
        };
        mapRef.current.animateToRegion(newRegion, 300);
        // Don't call onZoomOut to avoid infinite loop with ref pattern
      }
    }, [region]);

    const handleCenterLocation = useCallback(() => {
      if (mapRef.current && userLocation) {
        const newRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapRef.current.animateToRegion(newRegion, 1000);
        // Don't call onCenterLocation to avoid infinite loop with ref pattern
      }
    }, [userLocation]);

    // Handle region changes to keep internal state in sync
    const handleRegionChange = useCallback((newRegion: Region) => {
      setRegion(newRegion);
    }, []);

    // Handle animate to region
    const handleAnimateToRegion = useCallback((newRegion: Region, duration: number = 1000) => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, duration);
        setRegion(newRegion);
      }
    }, []);

    // Expose zoom functions to parent component
    useImperativeHandle(
      ref,
      () => ({
        zoomIn: handleZoomIn,
        zoomOut: handleZoomOut,
        centerOnLocation: handleCenterLocation,
        animateToRegion: handleAnimateToRegion,
      }),
      [handleZoomIn, handleZoomOut, handleCenterLocation, handleAnimateToRegion],
    );

    const markers = useMemo(
      () =>
        points.map(point => {
          const key = `listing-${point.id}`;

          // Debug marker rendering
          if (__DEV__) {
            console.log('🔍 Rendering marker:', {
              id: point.id,
              coordinates: { lat: point.latitude, lng: point.longitude },
              rating: point.rating,
              title: point.title,
            });
          }

          return (
            <ListingMarker
              key={key}
              point={point}
              selected={point.id === selectedId}
              onPress={() => handleMarkerPress(point)}
            />
          );
        }),
      [points, selectedId, handleMarkerPress],
    );

    // Debug logging for selectedId
    if (__DEV__ && selectedId) {
      console.log('🔍 NativeMapView selectedId:', selectedId);
    }

    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        onLayout={onLayout}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
        mapPadding={{
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
        showsBuildings={true}
        showsIndoors={true}
        showsPointsOfInterest={false}
        showsTraffic={false}
      >
        {markers}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

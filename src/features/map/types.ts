import { Region } from 'react-native-maps';

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  kosher_level?: 'meat' | 'dairy' | 'parve';
}

export interface GeoJSONPoint {
  type: 'Feature';
  id: number | string;
  properties: {
    cluster: boolean;
    id: string;
    rating: number | null;
    title: string;
    description: string;
    category: string;
    imageUrl?: string;
    point_count?: number;
    point_count_abbreviated?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface ClusterNode extends GeoJSONPoint {
  properties: GeoJSONPoint['properties'] & {
    cluster_id?: number;
  };
}

export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

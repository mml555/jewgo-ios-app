import { create } from 'zustand';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  zipCode?: string;
  city?: string;
  state?: string;
}

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  permissionRequested: boolean;
  permissionDenied: boolean;
  setLocation: (location: LocationData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPermissionState: (granted: boolean, requested: boolean, denied: boolean) => void;
  reset: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  loading: false,
  error: null,
  permissionGranted: false,
  permissionRequested: false,
  permissionDenied: false,
  setLocation: (location) => {
    console.log('🔍 LocationStore: setLocation called with:', location);
    set({ location, error: null });
  },
  setLoading: (loading) => {
    console.log('🔍 LocationStore: setLoading called with:', loading);
    set({ loading });
  },
  setError: (error) => {
    console.log('🔍 LocationStore: setError called with:', error);
    set({ error, loading: false });
  },
  setPermissionState: (granted, requested, denied) => {
    console.log('🔍 LocationStore: setPermissionState called with:', { granted, requested, denied });
    set({ permissionGranted: granted, permissionRequested: requested, permissionDenied: denied });
  },
  reset: () => {
    console.log('🔍 LocationStore: reset called');
    set({
      location: null,
      loading: false,
      error: null,
      permissionGranted: false,
      permissionRequested: false,
      permissionDenied: false,
    });
  },
}));


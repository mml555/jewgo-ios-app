declare module 'react-native-config' {
  export interface NativeConfig {
    NODE_ENV?: string;
    API_BASE_URL?: string;
    GOOGLE_PLACES_API_KEY?: string;
    ENABLE_ANALYTICS?: string;
    ENABLE_PERFORMANCE_MONITORING?: string;
    DEBUG_MODE?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
import Config from 'react-native-config';
import { debugLog, warnLog, errorLog } from '../utils/logger';

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  googlePlacesApiKey: string;
  googleOAuthClientId: string;
  recaptchaSiteKey: string;
  enableAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  debugMode: boolean;
}

export class ConfigService {
  private static instance: ConfigService;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): EnvironmentConfig {
    // ALWAYS use Render backend - ignore localhost configurations
    // This ensures the mobile app connects to the production backend
    const RENDER_BACKEND_URL = 'https://jewgo-app-oyoh.onrender.com/api/v5';

    // If Config.API_BASE_URL is set and NOT localhost, use it, otherwise use Render
    let apiBaseUrl = RENDER_BACKEND_URL;
    if (
      Config.API_BASE_URL &&
      !Config.API_BASE_URL.includes('localhost') &&
      !Config.API_BASE_URL.includes('127.0.0.1') &&
      !Config.API_BASE_URL.includes('0.0.0.0')
    ) {
      apiBaseUrl = Config.API_BASE_URL;
      debugLog('🌐 Using custom API URL:', apiBaseUrl);
    } else {
      debugLog('🌐 Using Render backend:', RENDER_BACKEND_URL);
      if (Config.API_BASE_URL) {
        warnLog('⚠️ Ignoring localhost API URL:', Config.API_BASE_URL);
      }
    }

    return {
      nodeEnv:
        (Config.NODE_ENV as 'development' | 'staging' | 'production') ||
        'development',
      apiBaseUrl: apiBaseUrl,
      googlePlacesApiKey: Config.GOOGLE_PLACES_API_KEY || '',
      googleOAuthClientId: (Config as any).GOOGLE_OAUTH_CLIENT_ID || '',
      recaptchaSiteKey:
        (Config as any).RECAPTCHA_SITE_KEY ||
        '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key
      enableAnalytics: Config.ENABLE_ANALYTICS === 'true',
      enablePerformanceMonitoring:
        Config.ENABLE_PERFORMANCE_MONITORING === 'true',
      debugMode: Config.DEBUG_MODE === 'true',
    };
  }

  private validateConfig(): void {
    const requiredFields: (keyof EnvironmentConfig)[] = [
      'apiBaseUrl',
      'googlePlacesApiKey',
    ];

    const missingFields = requiredFields.filter(field => {
      const value = this.config[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      const errorMessage = `Missing required environment variables: ${missingFields.join(
        ', ',
      )}`;
      errorLog('❌ Configuration Error:', errorMessage);

      if (this.config.nodeEnv === 'production') {
        throw new Error(errorMessage);
      } else {
        warnLog('⚠️ Configuration Warning:', errorMessage);
      }
    }

    // Log configuration in development mode
    if (this.config.debugMode) {
      debugLog('🔧 Configuration loaded:', {
        ...this.config,
        googlePlacesApiKey: this.config.googlePlacesApiKey
          ? '***HIDDEN***'
          : 'NOT SET',
      });
    }
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  public get googlePlacesApiKey(): string {
    return this.config.googlePlacesApiKey;
  }

  public get googleOAuthClientId(): string {
    return this.config.googleOAuthClientId;
  }

  public get recaptchaSiteKey(): string {
    return this.config.recaptchaSiteKey;
  }

  public get enableAnalytics(): boolean {
    return this.config.enableAnalytics;
  }

  public get enablePerformanceMonitoring(): boolean {
    return this.config.enablePerformanceMonitoring;
  }

  public get debugMode(): boolean {
    return this.config.debugMode;
  }

  public get nodeEnv(): 'development' | 'staging' | 'production' {
    return this.config.nodeEnv;
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isStaging(): boolean {
    return this.config.nodeEnv === 'staging';
  }

  public getApiUrl(): string {
    return this.config.apiBaseUrl;
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();

// Export static methods for convenience
export const getConfig = () => configService.getConfig();
export const isProduction = () => configService.isProduction();
export const isDevelopment = () => configService.isDevelopment();
export const isStaging = () => configService.isStaging();

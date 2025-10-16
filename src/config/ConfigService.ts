import {
  API_BASE_URL,
  NODE_ENV,
  GOOGLE_PLACES_API_KEY,
  GOOGLE_OAUTH_CLIENT_ID,
  RECAPTCHA_SITE_KEY,
  ENABLE_ANALYTICS,
  ENABLE_PERFORMANCE_MONITORING,
  DEBUG_MODE,
} from '@env';
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
    // Load API URL from environment variable
    // Make sure .env file is configured with the correct API_BASE_URL
    const apiBaseUrl = API_BASE_URL;

    // Validate and log the API URL being used
    if (!apiBaseUrl) {
      const errorMsg =
        'API_BASE_URL not found in environment configuration. Please check your .env file.';
      errorLog('❌ Configuration Error:', errorMsg);
      throw new Error(errorMsg);
    }

    debugLog('🌐 API Base URL:', apiBaseUrl);

    return {
      nodeEnv:
        (NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      apiBaseUrl: apiBaseUrl,
      googlePlacesApiKey: GOOGLE_PLACES_API_KEY || '',
      googleOAuthClientId: GOOGLE_OAUTH_CLIENT_ID || '',
      recaptchaSiteKey:
        RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key
      enableAnalytics: ENABLE_ANALYTICS === 'true',
      enablePerformanceMonitoring: ENABLE_PERFORMANCE_MONITORING === 'true',
      debugMode: DEBUG_MODE === 'true',
    };
  }

  private validateConfig(): void {
    // Required fields that must be present
    const requiredFields: (keyof EnvironmentConfig)[] = ['apiBaseUrl'];

    // Optional fields that should be warned about if missing
    const optionalFields: (keyof EnvironmentConfig)[] = ['googlePlacesApiKey'];

    const missingRequired = requiredFields.filter(field => {
      const value = this.config[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    const missingOptional = optionalFields.filter(field => {
      const value = this.config[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    // Error for missing required fields
    if (missingRequired.length > 0) {
      const errorMessage = `Missing required environment variables: ${missingRequired.join(
        ', ',
      )}`;
      errorLog('❌ Configuration Error:', errorMessage);
      throw new Error(errorMessage);
    }

    // Warning for missing optional fields
    if (missingOptional.length > 0 && this.config.debugMode) {
      const warningMessage = `Missing optional environment variables: ${missingOptional.join(
        ', ',
      )}`;
      warnLog('⚠️ Configuration Warning:', warningMessage);
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

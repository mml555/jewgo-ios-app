import Config from 'react-native-config';

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  googlePlacesApiKey: string;
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
    // Force the correct API URL for development
    const apiBaseUrl = __DEV__ ? 'http://localhost:3001/api/v5' : (Config.API_BASE_URL || 'https://api.jewgo.app/api/v5');
    
    return {
      nodeEnv: (Config.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      apiBaseUrl: apiBaseUrl,
      googlePlacesApiKey: Config.GOOGLE_PLACES_API_KEY || '',
      enableAnalytics: Config.ENABLE_ANALYTICS === 'true',
      enablePerformanceMonitoring: Config.ENABLE_PERFORMANCE_MONITORING === 'true',
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
      const errorMessage = `Missing required environment variables: ${missingFields.join(', ')}`;
      console.error('❌ Configuration Error:', errorMessage);
      
      if (this.config.nodeEnv === 'production') {
        throw new Error(errorMessage);
      } else {
        console.warn('⚠️ Configuration Warning:', errorMessage);
      }
    }

    // Log configuration in development mode
    if (this.config.debugMode) {
      console.log('🔧 Configuration loaded:', {
        ...this.config,
        googlePlacesApiKey: this.config.googlePlacesApiKey ? '***HIDDEN***' : 'NOT SET',
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
}

// Export singleton instance
export const configService = ConfigService.getInstance();

// Export static methods for convenience
export const getConfig = () => configService.getConfig();
export const isProduction = () => configService.isProduction();
export const isDevelopment = () => configService.isDevelopment();
export const isStaging = () => configService.isStaging();
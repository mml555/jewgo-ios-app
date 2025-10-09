/**
 * Location Privacy Service
 * Implements security and privacy guardrails for location data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorLog, warnLog, debugLog } from '../utils/logger';

export interface LocationPrivacyConfig {
  // Data retention
  maxLocationHistoryDays: number;
  maxCachedLocations: number;

  // Privacy settings
  allowLocationLogging: boolean;
  allowPreciseLocation: boolean;
  allowBackgroundLocation: boolean;

  // Security settings
  encryptLocationData: boolean;
  requireUserConsent: boolean;
  anonymizeLocationData: boolean;

  // Rate limiting
  maxLocationRequestsPerMinute: number;
  maxLocationRequestsPerHour: number;

  // Data sharing
  allowLocationSharing: boolean;
  allowAnalyticsSharing: boolean;
}

export interface LocationDataPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  sessionId: string;
  anonymized?: boolean;
}

export interface PrivacyConsent {
  locationAccess: boolean;
  preciseLocation: boolean;
  locationLogging: boolean;
  analyticsSharing: boolean;
  dataRetention: boolean;
  timestamp: number;
  version: string;
}

class LocationPrivacyService {
  private config: LocationPrivacyConfig;
  private consent: PrivacyConsent | null = null;
  private locationHistory: LocationDataPoint[] = [];
  private requestCounts: Map<number, number> = new Map();
  private encryptionKey: string | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConsent();
    this.loadLocationHistory();
    this.cleanupOldData();
  }

  private getDefaultConfig(): LocationPrivacyConfig {
    return {
      maxLocationHistoryDays: 7,
      maxCachedLocations: 100,
      allowLocationLogging: false,
      allowPreciseLocation: true,
      allowBackgroundLocation: false,
      encryptLocationData: true,
      requireUserConsent: true,
      anonymizeLocationData: true,
      maxLocationRequestsPerMinute: 10,
      maxLocationRequestsPerHour: 60,
      allowLocationSharing: false,
      allowAnalyticsSharing: false,
    };
  }

  // Privacy consent management
  async requestConsent(): Promise<PrivacyConsent> {
    // In a real app, this would show a privacy consent dialog
    const consent: PrivacyConsent = {
      locationAccess: true,
      preciseLocation: true,
      locationLogging: false,
      analyticsSharing: false,
      dataRetention: true,
      timestamp: Date.now(),
      version: '1.0',
    };

    await this.saveConsent(consent);
    this.consent = consent;

    return consent;
  }

  async getConsent(): Promise<PrivacyConsent | null> {
    if (!this.consent) {
      await this.loadConsent();
    }
    return this.consent;
  }

  async updateConsent(updates: Partial<PrivacyConsent>): Promise<void> {
    if (!this.consent) {
      throw new Error('No consent found. Please request consent first.');
    }

    const updatedConsent: PrivacyConsent = {
      ...this.consent,
      ...updates,
      timestamp: Date.now(),
    };

    await this.saveConsent(updatedConsent);
    this.consent = updatedConsent;
  }

  private async loadConsent(): Promise<void> {
    try {
      const consentData = await AsyncStorage.getItem(
        'location_privacy_consent',
      );
      if (consentData) {
        this.consent = JSON.parse(consentData);
      }
    } catch (error) {
      errorLog('Failed to load privacy consent:', error);
    }
  }

  private async saveConsent(consent: PrivacyConsent): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'location_privacy_consent',
        JSON.stringify(consent),
      );
    } catch (error) {
      errorLog('Failed to save privacy consent:', error);
    }
  }

  // Location data management
  async storeLocationData(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }): Promise<void> {
    if (!this.consent?.locationLogging) {
      return; // Don't store if user hasn't consented
    }

    // Check rate limits
    if (!this.checkRateLimit()) {
      warnLog('Location request rate limit exceeded');
      return;
    }

    const dataPoint: LocationDataPoint = {
      ...location,
      sessionId: this.generateSessionId(),
    };

    // Anonymize if configured
    if (this.config.anonymizeLocationData) {
      dataPoint.latitude = this.anonymizeCoordinate(location.latitude);
      dataPoint.longitude = this.anonymizeCoordinate(location.longitude);
      dataPoint.anonymized = true;
    }

    // Encrypt if configured
    if (this.config.encryptLocationData) {
      // In production, use proper encryption
      // dataPoint = await this.encryptLocationData(dataPoint);
    }

    this.locationHistory.push(dataPoint);
    await this.saveLocationHistory();
    this.cleanupOldData();
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    const hourKey = Math.floor(now / 3600000);

    const minuteCount = this.requestCounts.get(minuteKey) || 0;
    const hourCount = this.requestCounts.get(hourKey) || 0;

    if (minuteCount >= this.config.maxLocationRequestsPerMinute) {
      return false;
    }

    if (hourCount >= this.config.maxLocationRequestsPerHour) {
      return false;
    }

    // Update counts
    this.requestCounts.set(minuteKey, minuteCount + 1);
    this.requestCounts.set(hourKey, hourCount + 1);

    // Clean up old counts
    this.cleanupRequestCounts();

    return true;
  }

  private cleanupRequestCounts(): void {
    const now = Date.now();
    const cutoff = now - 3600000; // 1 hour ago

    for (const [key] of this.requestCounts) {
      if (key * 60000 < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }

  private anonymizeCoordinate(coord: number): number {
    // Round to 3 decimal places (~100-150m precision)
    return Math.round(coord * 1000) / 1000;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadLocationHistory(): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem('location_history');
      if (historyData) {
        this.locationHistory = JSON.parse(historyData);
      }
    } catch (error) {
      errorLog('Failed to load location history:', error);
    }
  }

  private async saveLocationHistory(): Promise<void> {
    try {
      // Only save if user has consented
      if (this.consent?.locationLogging) {
        await AsyncStorage.setItem(
          'location_history',
          JSON.stringify(this.locationHistory),
        );
      }
    } catch (error) {
      errorLog('Failed to save location history:', error);
    }
  }

  private cleanupOldData(): void {
    const cutoff =
      Date.now() - this.config.maxLocationHistoryDays * 24 * 60 * 60 * 1000;

    this.locationHistory = this.locationHistory.filter(
      point => point.timestamp > cutoff,
    );

    // Limit total number of cached locations
    if (this.locationHistory.length > this.config.maxCachedLocations) {
      this.locationHistory = this.locationHistory.slice(
        -this.config.maxCachedLocations,
      );
    }
  }

  // Data export and deletion
  async exportLocationData(): Promise<LocationDataPoint[]> {
    if (!this.consent?.dataRetention) {
      throw new Error('User has not consented to data retention');
    }

    return [...this.locationHistory];
  }

  async deleteLocationData(): Promise<void> {
    this.locationHistory = [];
    await AsyncStorage.removeItem('location_history');
    await AsyncStorage.removeItem('location_privacy_consent');
    this.consent = null;
  }

  async deleteOldLocationData(): Promise<void> {
    this.cleanupOldData();
    await this.saveLocationHistory();
  }

  // Privacy-compliant logging
  logLocationEvent(event: string, data?: Record<string, any>): void {
    if (!this.consent?.locationLogging) {
      return;
    }

    // Remove sensitive data
    const sanitizedData = this.sanitizeLogData(data);

    debugLog(`📍 Location Event [${event}]:`, sanitizedData);
  }

  private sanitizeLogData(data?: Record<string, any>): Record<string, any> {
    if (!data) return {};

    const sanitized = { ...data };

    // Remove or anonymize sensitive fields
    if (sanitized.latitude) {
      sanitized.latitude = this.anonymizeCoordinate(sanitized.latitude);
    }

    if (sanitized.longitude) {
      sanitized.longitude = this.anonymizeCoordinate(sanitized.longitude);
    }

    // Remove other sensitive fields
    delete sanitized.userId;
    delete sanitized.deviceId;
    delete sanitized.ipAddress;

    return sanitized;
  }

  // Configuration management
  updateConfig(updates: Partial<LocationPrivacyConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): LocationPrivacyConfig {
    return { ...this.config };
  }

  // Privacy compliance checks
  isPrivacyCompliant(): boolean {
    return (
      this.consent !== null &&
      this.consent.locationAccess &&
      this.consent.timestamp > Date.now() - 365 * 24 * 60 * 60 * 1000 // 1 year
    );
  }

  getPrivacyStatus(): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.consent) {
      issues.push('No privacy consent on file');
      recommendations.push('Request user consent for location data usage');
    }

    if (
      this.consent &&
      this.consent.timestamp < Date.now() - 365 * 24 * 60 * 60 * 1000
    ) {
      issues.push('Privacy consent is outdated');
      recommendations.push('Request updated consent from user');
    }

    if (this.locationHistory.length > this.config.maxCachedLocations) {
      issues.push('Location history exceeds configured limit');
      recommendations.push('Clean up old location data');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations,
    };
  }

  // GDPR compliance
  async handleDataSubjectRequest(
    type: 'access' | 'portability' | 'erasure',
  ): Promise<any> {
    switch (type) {
      case 'access':
        return {
          consent: this.consent,
          locationHistory: this.locationHistory,
          config: this.config,
        };

      case 'portability':
        return {
          locationHistory: this.locationHistory,
          format: 'json',
          exportedAt: new Date().toISOString(),
        };

      case 'erasure':
        await this.deleteLocationData();
        return { deleted: true, timestamp: Date.now() };

      default:
        throw new Error('Invalid data subject request type');
    }
  }
}

// Export singleton instance
export const locationPrivacyService = new LocationPrivacyService();
export default locationPrivacyService;

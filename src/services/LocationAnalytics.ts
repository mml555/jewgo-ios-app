/**
 * Location Analytics Service
 * Tracks location-related metrics and performance for monitoring and optimization
 */

import { debugLog, errorLog, warnLog } from '../utils/logger';

export interface LocationMetrics {
  // Permission metrics
  permissionRequests: number;
  permissionGranted: number;
  permissionDenied: number;
  permissionBlocked: number;

  // Accuracy metrics
  fullAccuracyCount: number;
  reducedAccuracyCount: number;

  // Performance metrics
  timeToFirstFix: number[];
  locationErrors: number;
  fallbackUsage: number;

  // Usage metrics
  locationRequests: number;
  successfulLocations: number;
  cachedLocationUsage: number;

  // Error metrics
  timeoutErrors: number;
  permissionErrors: number;
  positionUnavailableErrors: number;

  // Session metrics
  sessionStartTime: number;
  lastLocationTime: number;
}

export interface LocationEvent {
  type:
    | 'permission_request'
    | 'permission_granted'
    | 'permission_denied'
    | 'location_success'
    | 'location_error'
    | 'accuracy_changed'
    | 'fallback_used'
    | 'cache_hit'
    | 'timeout'
    | 'session_start';
  timestamp: number;
  data?: Record<string, any>;
}

class LocationAnalytics {
  private metrics: LocationMetrics;
  private events: LocationEvent[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.metrics = this.initializeMetrics();
    this.trackEvent('session_start', { sessionId: this.sessionId });
  }

  private generateSessionId(): string {
    return `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): LocationMetrics {
    return {
      permissionRequests: 0,
      permissionGranted: 0,
      permissionDenied: 0,
      permissionBlocked: 0,
      fullAccuracyCount: 0,
      reducedAccuracyCount: 0,
      timeToFirstFix: [],
      locationErrors: 0,
      fallbackUsage: 0,
      locationRequests: 0,
      successfulLocations: 0,
      cachedLocationUsage: 0,
      timeoutErrors: 0,
      permissionErrors: 0,
      positionUnavailableErrors: 0,
      sessionStartTime: Date.now(),
      lastLocationTime: 0,
    };
  }

  // Track events
  trackEvent(type: LocationEvent['type'], data?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: LocationEvent = {
      type,
      timestamp: Date.now(),
      data: {
        sessionId: this.sessionId,
        ...data,
      },
    };

    this.events.push(event);
    this.updateMetrics(event);
    this.logEvent(event);
  }

  private updateMetrics(event: LocationEvent): void {
    switch (event.type) {
      case 'permission_request':
        this.metrics.permissionRequests++;
        break;

      case 'permission_granted':
        this.metrics.permissionGranted++;
        break;

      case 'permission_denied':
        this.metrics.permissionDenied++;
        break;

      case 'location_success':
        this.metrics.successfulLocations++;
        this.metrics.lastLocationTime = event.timestamp;
        if (event.data?.timeToFirstFix) {
          this.metrics.timeToFirstFix.push(event.data.timeToFirstFix);
        }
        if (event.data?.accuracyAuthorization === 'full') {
          this.metrics.fullAccuracyCount++;
        } else if (event.data?.accuracyAuthorization === 'reduced') {
          this.metrics.reducedAccuracyCount++;
        }
        break;

      case 'location_error':
        this.metrics.locationErrors++;
        if (event.data?.errorClass === 'timeout') {
          this.metrics.timeoutErrors++;
        } else if (event.data?.errorClass === 'permission_denied') {
          this.metrics.permissionErrors++;
        } else if (event.data?.errorClass === 'position_unavailable') {
          this.metrics.positionUnavailableErrors++;
        }
        break;

      case 'fallback_used':
        this.metrics.fallbackUsage++;
        break;

      case 'cache_hit':
        this.metrics.cachedLocationUsage++;
        break;
    }
  }

  private logEvent(event: LocationEvent): void {
    debugLog(`📍 Location Analytics [${event.type}]:`, {
      timestamp: new Date(event.timestamp).toISOString(),
      sessionId: this.sessionId,
      ...event.data,
    });
  }

  // Get current metrics
  getMetrics(): LocationMetrics {
    return { ...this.metrics };
  }

  // Get performance summary
  getPerformanceSummary(): {
    successRate: number;
    averageTimeToFirstFix: number;
    permissionGrantRate: number;
    accuracyDistribution: { full: number; reduced: number };
    errorRate: number;
    fallbackRate: number;
  } {
    const totalRequests = this.metrics.locationRequests || 1;
    const totalPermissionRequests = this.metrics.permissionRequests || 1;
    const totalEvents =
      this.metrics.successfulLocations + this.metrics.locationErrors;

    return {
      successRate: this.metrics.successfulLocations / totalRequests,
      averageTimeToFirstFix:
        this.metrics.timeToFirstFix.length > 0
          ? this.metrics.timeToFirstFix.reduce((a, b) => a + b, 0) /
            this.metrics.timeToFirstFix.length
          : 0,
      permissionGrantRate:
        this.metrics.permissionGranted / totalPermissionRequests,
      accuracyDistribution: {
        full: this.metrics.fullAccuracyCount,
        reduced: this.metrics.reducedAccuracyCount,
      },
      errorRate: this.metrics.locationErrors / totalEvents,
      fallbackRate: this.metrics.fallbackUsage / totalRequests,
    };
  }

  // Get recent events
  getRecentEvents(limit: number = 50): LocationEvent[] {
    return this.events.slice(-limit).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get events by type
  getEventsByType(type: LocationEvent['type']): LocationEvent[] {
    return this.events.filter(event => event.type === type);
  }

  // Get session duration
  getSessionDuration(): number {
    return Date.now() - this.metrics.sessionStartTime;
  }

  // Check if location services are performing well
  isLocationServicesHealthy(): boolean {
    const summary = this.getPerformanceSummary();

    return (
      summary.successRate > 0.8 && // 80% success rate
      summary.averageTimeToFirstFix < 5000 && // Under 5 seconds
      summary.errorRate < 0.2 && // Less than 20% error rate
      summary.fallbackRate < 0.3 // Less than 30% fallback usage
    );
  }

  // Get health status with details
  getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const summary = this.getPerformanceSummary();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (summary.successRate < 0.8) {
      issues.push('Low location success rate');
      recommendations.push('Check device location settings and permissions');
    }

    if (summary.averageTimeToFirstFix > 5000) {
      issues.push('Slow time to first fix');
      recommendations.push(
        'Consider increasing timeout or improving GPS signal',
      );
    }

    if (summary.errorRate > 0.2) {
      issues.push('High error rate');
      recommendations.push('Investigate location service errors');
    }

    if (summary.fallbackRate > 0.3) {
      issues.push('High fallback usage');
      recommendations.push(
        'Improve location accuracy or reduce fallback threshold',
      );
    }

    if (summary.permissionGrantRate < 0.5) {
      issues.push('Low permission grant rate');
      recommendations.push('Review permission request flow and user education');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }

  // Export data for analysis
  exportData(): {
    sessionId: string;
    metrics: LocationMetrics;
    events: LocationEvent[];
    summary: any;
    health: any;
  } {
    return {
      sessionId: this.sessionId,
      metrics: this.getMetrics(),
      events: this.events,
      summary: this.getPerformanceSummary(),
      health: this.getHealthStatus(),
    };
  }

  // Reset metrics (for testing or new session)
  reset(): void {
    this.sessionId = this.generateSessionId();
    this.metrics = this.initializeMetrics();
    this.events = [];
    this.trackEvent('session_start', { sessionId: this.sessionId });
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Send data to analytics service (placeholder for production)
  async sendToAnalyticsService(data: any): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // In production, send to your analytics service
      // await fetch('/api/analytics/location', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });

      debugLog('📍 Analytics data sent:', data);
    } catch (error) {
      errorLog('Failed to send analytics data:', error);
    }
  }

  // Periodic health check
  startHealthMonitoring(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      const health = this.getHealthStatus();

      if (!health.healthy) {
        warnLog('📍 Location services health issues detected:', health.issues);
      }

      // Send periodic health data
      this.sendToAnalyticsService({
        type: 'health_check',
        timestamp: Date.now(),
        health,
        metrics: this.getMetrics(),
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const locationAnalytics = new LocationAnalytics();
export default locationAnalytics;

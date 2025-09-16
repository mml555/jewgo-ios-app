/**
 * Performance Testing Configuration
 * Centralized configuration for performance tests and monitoring
 */

export interface PerformanceThresholds {
  network: {
    wifi: { maxRenderTime: number; maxLatency: number };
    fourG: { maxRenderTime: number; maxLatency: number };
    threeG: { maxRenderTime: number; maxLatency: number };
    slowThreeG: { maxRenderTime: number; maxLatency: number };
  };
  memory: {
    baselineMax: number; // MB
    peakMax: number; // MB
    leakThreshold: number; // percentage increase
  };
  autoSave: {
    smallDataMax: number; // ms
    mediumDataMax: number; // ms
    largeDataMax: number; // ms
  };
  animation: {
    minFrameRate: number; // FPS
    minSmoothness: number; // percentage
    maxDroppedFrames: number;
  };
  scalability: {
    maxDegradation: number; // multiplier
    maxMemoryRatio: number; // multiplier
  };
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  network: {
    wifi: { maxRenderTime: 1000, maxLatency: 50 },
    fourG: { maxRenderTime: 2000, maxLatency: 200 },
    threeG: { maxRenderTime: 3000, maxLatency: 500 },
    slowThreeG: { maxRenderTime: 5000, maxLatency: 1000 }
  },
  memory: {
    baselineMax: 100, // 100MB baseline
    peakMax: 200, // 200MB peak
    leakThreshold: 20 // 20% increase indicates leak
  },
  autoSave: {
    smallDataMax: 100, // 100ms for small data
    mediumDataMax: 200, // 200ms for medium data
    largeDataMax: 500 // 500ms for large data
  },
  animation: {
    minFrameRate: 55, // 55 FPS minimum
    minSmoothness: 90, // 90% smoothness
    maxDroppedFrames: 5 // Max 5 dropped frames per 2 seconds
  },
  scalability: {
    maxDegradation: 3, // 3x max performance degradation
    maxMemoryRatio: 6 // 6x max memory usage for 5 forms
  }
};

export interface MonitoringConfig {
  enableMemoryMonitoring: boolean;
  enableFrameRateMonitoring: boolean;
  enableInteractionTracking: boolean;
  enableNetworkMonitoring: boolean;
  monitoringInterval: number; // ms
  maxMetricsHistory: number;
  autoExport: boolean;
  exportInterval: number; // ms
}

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enableMemoryMonitoring: true,
  enableFrameRateMonitoring: true,
  enableInteractionTracking: true,
  enableNetworkMonitoring: false, // Disabled by default in production
  monitoringInterval: 1000, // Every 1 second
  maxMetricsHistory: 100,
  autoExport: false,
  exportInterval: 60000 // Every minute
};

export const DEVELOPMENT_MONITORING_CONFIG: MonitoringConfig = {
  ...DEFAULT_MONITORING_CONFIG,
  enableNetworkMonitoring: true,
  monitoringInterval: 500, // More frequent in development
  autoExport: true,
  exportInterval: 30000 // Every 30 seconds
};

export interface TestConfig {
  timeout: number; // ms
  retries: number;
  parallel: boolean;
  verbose: boolean;
  generateReport: boolean;
  exportResults: boolean;
}

export const PERFORMANCE_TEST_CONFIG: TestConfig = {
  timeout: 30000, // 30 second timeout
  retries: 2,
  parallel: false, // Run tests sequentially for accurate measurements
  verbose: true,
  generateReport: true,
  exportResults: true
};

export interface FormTestConfig {
  maxFormInstances: number;
  testDataSizes: number[];
  networkConditions: string[];
  animationDuration: number; // ms
  memoryMonitoringDuration: number; // ms
}

export const FORM_TEST_CONFIG: FormTestConfig = {
  maxFormInstances: 5,
  testDataSizes: [100, 500, 1000], // Small, medium, large
  networkConditions: ['WiFi', '4G', '3G', 'Slow 3G', 'Offline'],
  animationDuration: 2000, // 2 seconds
  memoryMonitoringDuration: 5000 // 5 seconds
};

export interface ReportConfig {
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeRawData: boolean;
  format: 'json' | 'csv' | 'html';
  outputPath: string;
}

export const REPORT_CONFIG: ReportConfig = {
  includeCharts: false, // Disabled for React Native
  includeRecommendations: true,
  includeRawData: true,
  format: 'json',
  outputPath: './performance-reports'
};

// Environment-specific configurations
export const getConfigForEnvironment = (env: 'development' | 'test' | 'production') => {
  switch (env) {
    case 'development':
      return {
        monitoring: DEVELOPMENT_MONITORING_CONFIG,
        thresholds: PERFORMANCE_THRESHOLDS,
        testing: { ...PERFORMANCE_TEST_CONFIG, verbose: true },
        reporting: { ...REPORT_CONFIG, includeRawData: true }
      };
    
    case 'test':
      return {
        monitoring: { ...DEFAULT_MONITORING_CONFIG, monitoringInterval: 100 },
        thresholds: PERFORMANCE_THRESHOLDS,
        testing: { ...PERFORMANCE_TEST_CONFIG, timeout: 10000, verbose: false },
        reporting: { ...REPORT_CONFIG, includeRawData: false }
      };
    
    case 'production':
      return {
        monitoring: { ...DEFAULT_MONITORING_CONFIG, enableNetworkMonitoring: false },
        thresholds: PERFORMANCE_THRESHOLDS,
        testing: PERFORMANCE_TEST_CONFIG,
        reporting: { ...REPORT_CONFIG, includeRawData: false }
      };
    
    default:
      return {
        monitoring: DEFAULT_MONITORING_CONFIG,
        thresholds: PERFORMANCE_THRESHOLDS,
        testing: PERFORMANCE_TEST_CONFIG,
        reporting: REPORT_CONFIG
      };
  }
};

// Performance scoring weights
export const PERFORMANCE_WEIGHTS = {
  network: 0.25,
  memory: 0.25,
  autoSave: 0.20,
  animation: 0.20,
  scalability: 0.10
};

// Alert thresholds for production monitoring
export const ALERT_THRESHOLDS = {
  criticalMemoryUsage: 300, // MB
  criticalFrameRate: 30, // FPS
  criticalLatency: 2000, // ms
  criticalErrorRate: 0.05 // 5%
};

export default {
  PERFORMANCE_THRESHOLDS,
  DEFAULT_MONITORING_CONFIG,
  DEVELOPMENT_MONITORING_CONFIG,
  PERFORMANCE_TEST_CONFIG,
  FORM_TEST_CONFIG,
  REPORT_CONFIG,
  getConfigForEnvironment,
  PERFORMANCE_WEIGHTS,
  ALERT_THRESHOLDS
};
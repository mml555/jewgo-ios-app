/**
 * Performance Monitoring Hook
 * Real-time performance monitoring for form components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
// import { MemoryLeakDetector } from '../__tests__/performance/MemoryLeakDetector';

export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  frameRate: number;
  interactionLatency: number;
}

export interface PerformanceConfig {
  enableMemoryMonitoring: boolean;
  enableFrameRateMonitoring: boolean;
  enableInteractionTracking: boolean;
  monitoringInterval: number;
  maxMetricsHistory: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableMemoryMonitoring: true,
  enableFrameRateMonitoring: true,
  enableInteractionTracking: true,
  monitoringInterval: 1000,
  maxMetricsHistory: 100,
};

export const usePerformanceMonitor = (
  componentName: string,
  config: Partial<PerformanceConfig> = {},
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const memoryDetector = useRef<any | null>(null);
  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const interactionTimes = useRef<number[]>([]);
  const frameRequestId = useRef<number | null>(null);

  // Initialize memory detector
  useEffect(() => {
    if (finalConfig.enableMemoryMonitoring) {
      // memoryDetector.current = new MemoryLeakDetector();
      // memoryDetector.current.registerComponent(componentName);
    }

    return () => {
      if (memoryDetector.current) {
        memoryDetector.current.unregisterComponent(componentName);
        memoryDetector.current.stopMonitoring();
      }
    };
  }, [componentName, finalConfig.enableMemoryMonitoring]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) {
      return;
    }

    setIsMonitoring(true);
    renderStartTime.current = performance.now();

    if (memoryDetector.current) {
      memoryDetector.current.startMonitoring(finalConfig.monitoringInterval);
    }

    if (finalConfig.enableFrameRateMonitoring) {
      startFrameRateMonitoring();
    }
  }, [
    isMonitoring,
    finalConfig.monitoringInterval,
    finalConfig.enableFrameRateMonitoring,
  ]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) {
      return;
    }

    setIsMonitoring(false);

    // Cancel frame rate monitoring
    if (frameRequestId.current !== null) {
      cancelAnimationFrame(frameRequestId.current);
      frameRequestId.current = null;
    }

    if (memoryDetector.current) {
      memoryDetector.current.stopMonitoring();
    }
  }, [isMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameRequestId.current !== null) {
        cancelAnimationFrame(frameRequestId.current);
        frameRequestId.current = null;
      }
    };
  }, []);

  // Record render time
  const recordRenderStart = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const recordRenderEnd = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    updateMetrics({ renderTime });
  }, []);

  // Record interaction latency
  const recordInteractionStart = useCallback(() => {
    if (!finalConfig.enableInteractionTracking) {
      return;
    }

    const startTime = performance.now();
    return () => {
      const latency = performance.now() - startTime;
      interactionTimes.current.push(latency);

      // Keep only last 10 interaction times
      if (interactionTimes.current.length > 10) {
        interactionTimes.current.shift();
      }

      const averageLatency =
        interactionTimes.current.reduce((sum, time) => sum + time, 0) /
        interactionTimes.current.length;

      updateMetrics({ interactionLatency: averageLatency });
    };
  }, [finalConfig.enableInteractionTracking]);

  // Update metrics
  const updateMetrics = useCallback(
    (newMetrics: Partial<PerformanceMetrics>) => {
      setMetrics(prevMetrics => {
        const previousMetrics = prevMetrics[prevMetrics.length - 1] || {
          renderTime: 0,
          updateTime: 0,
          memoryUsage: 0,
          frameRate: 60,
          interactionLatency: 0,
        };

        const currentMetrics: PerformanceMetrics = {
          ...previousMetrics,
          ...newMetrics,
          memoryUsage:
            (memoryDetector as any).current?.takeSnapshot()?.heapUsed || 0,
        };

        const updatedMetrics = [...prevMetrics, currentMetrics];

        // Keep only the last N metrics
        if (updatedMetrics.length > finalConfig.maxMetricsHistory) {
          updatedMetrics.shift();
        }

        return updatedMetrics;
      });
    },
    [finalConfig.maxMetricsHistory],
  );

  // Frame rate monitoring
  const startFrameRateMonitoring = useCallback(() => {
    // Cancel any existing frame request
    if (frameRequestId.current !== null) {
      cancelAnimationFrame(frameRequestId.current);
      frameRequestId.current = null;
    }

    frameCount.current = 0;
    lastFrameTime.current = performance.now();

    const measureFrame = () => {
      if (!isMonitoring) {
        frameRequestId.current = null;
        return;
      }

      frameCount.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastFrameTime.current;

      if (elapsed >= 1000) {
        // Calculate FPS every second
        const fps = (frameCount.current * 1000) / elapsed;
        updateMetrics({ frameRate: fps });

        frameCount.current = 0;
        lastFrameTime.current = currentTime;
      }

      frameRequestId.current = requestAnimationFrame(measureFrame);
    };

    frameRequestId.current = requestAnimationFrame(measureFrame);
  }, [isMonitoring, updateMetrics]);

  // Get current performance summary
  const getPerformanceSummary = useCallback(() => {
    if (metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageFrameRate: 60,
        averageMemoryUsage: 0,
        averageInteractionLatency: 0,
        performanceScore: 100,
      };
    }

    const recent = metrics.slice(-10); // Last 10 metrics

    const averageRenderTime =
      recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length;
    const averageFrameRate =
      recent.reduce((sum, m) => sum + m.frameRate, 0) / recent.length;
    const averageMemoryUsage =
      recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
    const averageInteractionLatency =
      recent.reduce((sum, m) => sum + m.interactionLatency, 0) / recent.length;

    // Calculate performance score (0-100)
    let performanceScore = 100;

    if (averageRenderTime > 100) {
      performanceScore -= 20;
    }
    if (averageFrameRate < 50) {
      performanceScore -= 20;
    }
    if (averageMemoryUsage > 150) {
      performanceScore -= 20;
    }
    if (averageInteractionLatency > 100) {
      performanceScore -= 20;
    }

    performanceScore = Math.max(0, performanceScore);

    return {
      averageRenderTime,
      averageFrameRate,
      averageMemoryUsage,
      averageInteractionLatency,
      performanceScore,
    };
  }, [metrics]);

  // Get memory leak analysis
  const getMemoryAnalysis = useCallback(() => {
    if (!memoryDetector.current) {
      return null;
    }

    return memoryDetector.current.analyzeLeaks();
  }, []);

  // Get performance recommendations
  const getRecommendations = useCallback(() => {
    const summary = getPerformanceSummary();
    const recommendations: string[] = [];

    if (summary.averageRenderTime > 100) {
      recommendations.push(
        'Render time is high. Consider using React.memo or optimizing component logic.',
      );
    }

    if (summary.averageFrameRate < 50) {
      recommendations.push(
        'Frame rate is low. Reduce animation complexity or optimize rendering.',
      );
    }

    if (summary.averageMemoryUsage > 150) {
      recommendations.push(
        'Memory usage is high. Check for memory leaks or optimize data structures.',
      );
    }

    if (summary.averageInteractionLatency > 100) {
      recommendations.push(
        'Interaction latency is high. Optimize event handlers or use debouncing.',
      );
    }

    const memoryAnalysis = getMemoryAnalysis();
    if (memoryAnalysis?.isLeaking) {
      recommendations.push(
        'Memory leak detected. Review component cleanup and useEffect dependencies.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable limits.');
    }

    return recommendations;
  }, [getPerformanceSummary, getMemoryAnalysis]);

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    const summary = getPerformanceSummary();
    const memoryAnalysis = getMemoryAnalysis();
    const recommendations = getRecommendations();

    return {
      componentName,
      timestamp: new Date().toISOString(),
      metrics,
      summary,
      memoryAnalysis,
      recommendations,
      config: finalConfig,
    };
  }, [
    componentName,
    metrics,
    getPerformanceSummary,
    getMemoryAnalysis,
    getRecommendations,
    finalConfig,
  ]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics([]);
    interactionTimes.current = [];
    frameCount.current = 0;

    if (memoryDetector.current) {
      memoryDetector.current.reset();
    }
  }, []);

  return {
    // State
    metrics,
    isMonitoring,

    // Control methods
    startMonitoring,
    stopMonitoring,
    resetMetrics,

    // Recording methods
    recordRenderStart,
    recordRenderEnd,
    recordInteractionStart,

    // Analysis methods
    getPerformanceSummary,
    getMemoryAnalysis,
    getRecommendations,
    exportPerformanceData,
  };
};

export default usePerformanceMonitor;

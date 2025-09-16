/**
 * Performance Benchmark Tests
 * Core performance tests without React component dependencies
 */

import { PerformanceTestRunner } from './PerformanceTestSuite';
import { MemoryLeakDetector } from './MemoryLeakDetector';
import { PerformanceTestExecutor } from './runPerformanceTests';

describe('Performance Benchmark Tests', () => {
  let performanceRunner: PerformanceTestRunner;
  let memoryDetector: MemoryLeakDetector;

  beforeEach(() => {
    performanceRunner = new PerformanceTestRunner();
    memoryDetector = new MemoryLeakDetector();
    
    // Mock performance.now for consistent testing
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    memoryDetector.stopMonitoring();
  });

  describe('Network Performance Tests', () => {
    it('should test network conditions within acceptable time limits', async () => {
      const startTime = Date.now();
      const results = await performanceRunner.testNetworkConditions();
      const testDuration = Date.now() - startTime;

      // Test should complete within 10 seconds
      expect(testDuration).toBeLessThan(10000);
      
      // Should test all network conditions
      expect(results.size).toBe(5); // WiFi, 4G, 3G, Slow 3G, Offline
      
      // WiFi should have best performance
      const wifiMetrics = results.get('WiFi');
      expect(wifiMetrics).toBeDefined();
      expect(wifiMetrics!.renderTime).toBeLessThan(1000);
    });

    it('should handle offline conditions gracefully', async () => {
      const results = await performanceRunner.testNetworkConditions();
      const offlineMetrics = results.get('Offline');

      expect(offlineMetrics).toBeDefined();
      // Should not crash in offline mode
      expect(offlineMetrics!.networkLatency).toBeDefined();
    });
  });

  describe('Memory Usage Tests', () => {
    it('should detect memory usage patterns', async () => {
      memoryDetector.startMonitoring(100); // Monitor every 100ms
      
      // Simulate some memory usage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const memoryResults = await performanceRunner.testMemoryUsage();
      
      expect(memoryResults.baseline).toBeGreaterThan(0);
      expect(memoryResults.peak).toBeGreaterThanOrEqual(memoryResults.baseline);
      expect(memoryResults.final).toBeGreaterThan(0);
      
      // Should not detect leaks in this simple test
      expect(memoryResults.leakDetected).toBe(false);
    });

    it('should track component registration', () => {
      memoryDetector.registerComponent('TestComponent');
      memoryDetector.registerComponent('TestComponent');
      memoryDetector.registerComponent('AnotherComponent');

      const snapshot = memoryDetector.takeSnapshot();
      expect(snapshot.componentCount).toBe(3);

      memoryDetector.unregisterComponent('TestComponent');
      const snapshot2 = memoryDetector.takeSnapshot();
      expect(snapshot2.componentCount).toBe(2);
    });

    it('should track event listeners', () => {
      memoryDetector.registerListener('scroll');
      memoryDetector.registerListener('resize');
      memoryDetector.registerListener('scroll');

      const snapshot = memoryDetector.takeSnapshot();
      expect(snapshot.listenerCount).toBe(3);

      memoryDetector.unregisterListener('scroll');
      const snapshot2 = memoryDetector.takeSnapshot();
      expect(snapshot2.listenerCount).toBe(2);
    });
  });

  describe('Auto-save Performance Tests', () => {
    it('should measure auto-save latency for different data sizes', async () => {
      const autoSaveResults = await performanceRunner.testAutoSavePerformance();

      expect(autoSaveResults.smallDataLatency).toBeGreaterThan(0);
      expect(autoSaveResults.mediumDataLatency).toBeGreaterThan(0);
      expect(autoSaveResults.largeDataLatency).toBeGreaterThan(0);
      expect(autoSaveResults.averageLatency).toBeGreaterThan(0);

      // Larger data should generally take longer (but not always due to simulation)
      expect(autoSaveResults.largeDataLatency).toBeGreaterThanOrEqual(autoSaveResults.smallDataLatency * 0.5);
    });

    it('should maintain reasonable auto-save performance', async () => {
      const autoSaveResults = await performanceRunner.testAutoSavePerformance();

      // All latencies should be under 1 second for this test
      expect(autoSaveResults.smallDataLatency).toBeLessThan(1000);
      expect(autoSaveResults.mediumDataLatency).toBeLessThan(1000);
      expect(autoSaveResults.largeDataLatency).toBeLessThan(1000);
    });
  });

  describe('Animation Performance Tests', () => {
    it('should measure animation frame rate', async () => {
      const animationResults = await performanceRunner.testAnimationPerformance();

      expect(animationResults.averageFrameRate).toBeGreaterThan(0);
      expect(animationResults.droppedFrames).toBeGreaterThanOrEqual(0);
      expect(animationResults.smoothnessScore).toBeGreaterThanOrEqual(0);
      expect(animationResults.smoothnessScore).toBeLessThanOrEqual(100);
    });

    it('should maintain acceptable frame rate', async () => {
      const animationResults = await performanceRunner.testAnimationPerformance();

      // Should maintain at least 30 FPS (allowing for test environment limitations)
      expect(animationResults.averageFrameRate).toBeGreaterThanOrEqual(30);
      
      // Smoothness score should be reasonable
      expect(animationResults.smoothnessScore).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Scalability Tests', () => {
    it('should test multiple form instances', async () => {
      const scalabilityResults = await performanceRunner.testMultipleFormInstances();

      expect(scalabilityResults.singleFormMetrics).toBeDefined();
      expect(scalabilityResults.multipleFormMetrics).toBeDefined();
      expect(scalabilityResults.scalabilityScore).toBeGreaterThan(0);

      // Scalability score should be reasonable (less than 10x degradation)
      expect(scalabilityResults.scalabilityScore).toBeLessThan(10);
    });

    it('should handle form scaling gracefully', async () => {
      const scalabilityResults = await performanceRunner.testMultipleFormInstances();

      // Memory usage should scale somewhat linearly
      const memoryRatio = scalabilityResults.multipleFormMetrics.memoryUsage / 
                         scalabilityResults.singleFormMetrics.memoryUsage;
      
      // Should not use more than 10x memory for 5 forms
      expect(memoryRatio).toBeLessThan(10);
    });
  });

  describe('Comprehensive Performance Report', () => {
    it('should generate complete performance report', async () => {
      const report = await performanceRunner.generatePerformanceReport();

      expect(report).toHaveProperty('networkTests');
      expect(report).toHaveProperty('memoryTests');
      expect(report).toHaveProperty('autoSaveTests');
      expect(report).toHaveProperty('animationTests');
      expect(report).toHaveProperty('scalabilityTests');
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('recommendations');

      expect(typeof report.overallScore).toBe('number');
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide actionable recommendations', async () => {
      const report = await performanceRunner.generatePerformanceReport();

      report.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Memory Leak Detection', () => {
    it('should analyze memory trends', () => {
      // Add some snapshots to simulate memory usage
      for (let i = 0; i < 15; i++) {
        memoryDetector.takeSnapshot();
      }

      const trend = memoryDetector.getMemoryTrend();
      
      expect(trend).toHaveProperty('trend');
      expect(trend).toHaveProperty('rate');
      expect(trend).toHaveProperty('confidence');
      
      expect(['increasing', 'decreasing', 'stable']).toContain(trend.trend);
      expect(trend.rate).toBeGreaterThanOrEqual(0);
      expect(trend.confidence).toBeGreaterThanOrEqual(0);
      expect(trend.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate memory report', () => {
      // Register some components and listeners
      memoryDetector.registerComponent('TestComponent');
      memoryDetector.registerListener('scroll');
      
      // Take some snapshots
      for (let i = 0; i < 5; i++) {
        memoryDetector.takeSnapshot();
      }

      const report = memoryDetector.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('leakAnalysis');
      expect(report).toHaveProperty('memoryTrend');
      expect(report).toHaveProperty('componentStats');
      expect(report).toHaveProperty('listenerStats');
      expect(report).toHaveProperty('recommendations');

      expect(report.summary.totalSnapshots).toBe(5);
      expect(report.componentStats.get('TestComponent')).toBe(1);
      expect(report.listenerStats.get('scroll')).toBe(1);
    });
  });

  describe('Performance Test Executor', () => {
    it('should run all performance tests', async () => {
      const executor = new PerformanceTestExecutor();
      const results = await executor.runAllTests();

      expect(results).toHaveProperty('summary');
      expect(results).toHaveProperty('results');
      expect(results).toHaveProperty('recommendations');

      expect(results.summary.totalTests).toBeGreaterThan(0);
      expect(results.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(results.summary.overallScore).toBeLessThanOrEqual(100);
      
      expect(Array.isArray(results.results)).toBe(true);
      expect(Array.isArray(results.recommendations)).toBe(true);
    });

    it('should export results in JSON format', async () => {
      const executor = new PerformanceTestExecutor();
      await executor.runAllTests();
      
      const jsonResults = executor.exportResults('json');
      
      expect(typeof jsonResults).toBe('string');
      
      const parsed = JSON.parse(jsonResults);
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('results');
      expect(parsed).toHaveProperty('recommendations');
      expect(parsed).toHaveProperty('exportedAt');
    });

    it('should export results in CSV format', async () => {
      const executor = new PerformanceTestExecutor();
      await executor.runAllTests();
      
      const csvResults = executor.exportResults('csv');
      
      expect(typeof csvResults).toBe('string');
      expect(csvResults).toContain('Timestamp,Test Suite,Passed,Score');
    });
  });
});
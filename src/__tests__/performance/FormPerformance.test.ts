/**
 * Form Performance Tests
 * Tests specific to Add Eatery form performance optimization
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { PerformanceTestRunner, NETWORK_CONDITIONS } from './PerformanceTestSuite';
import BusinessHoursSelector from '../../components/BusinessHoursSelector';
// Note: AddCategoryScreen import removed as it's not needed for performance tests

describe('Form Performance Tests', () => {
  let performanceRunner: PerformanceTestRunner;

  beforeEach(() => {
    performanceRunner = new PerformanceTestRunner();
    // Mock performance.now for consistent testing
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Network Condition Tests', () => {
    it('should maintain acceptable performance under WiFi conditions', async () => {
      const results = await performanceRunner.testNetworkConditions();
      const wifiMetrics = results.get('WiFi');

      expect(wifiMetrics).toBeDefined();
      expect(wifiMetrics!.renderTime).toBeLessThan(1000); // < 1 second
      expect(wifiMetrics!.autoSaveLatency).toBeLessThan(200); // < 200ms
    });

    it('should handle 4G network conditions gracefully', async () => {
      const results = await performanceRunner.testNetworkConditions();
      const fourGMetrics = results.get('4G');

      expect(fourGMetrics).toBeDefined();
      expect(fourGMetrics!.renderTime).toBeLessThan(2000); // < 2 seconds
      expect(fourGMetrics!.networkLatency).toBeLessThan(500); // < 500ms
    });

    it('should provide fallback behavior for slow 3G', async () => {
      const results = await performanceRunner.testNetworkConditions();
      const slow3GMetrics = results.get('Slow 3G');

      expect(slow3GMetrics).toBeDefined();
      expect(slow3GMetrics!.renderTime).toBeLessThan(5000); // < 5 seconds
      // Should still be functional even if slower
    });

    it('should handle offline conditions', async () => {
      const results = await performanceRunner.testNetworkConditions();
      const offlineMetrics = results.get('Offline');

      expect(offlineMetrics).toBeDefined();
      // Should not crash and should provide cached functionality
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks during normal usage', async () => {
      const memoryResults = await performanceRunner.testMemoryUsage();

      expect(memoryResults.leakDetected).toBe(false);
      expect(memoryResults.final).toBeLessThanOrEqual(memoryResults.peak);
    });

    it('should maintain reasonable memory usage with large forms', async () => {
      const memoryResults = await performanceRunner.testMemoryUsage();

      // Memory should not exceed 200MB for form operations
      expect(memoryResults.peak).toBeLessThan(200);
    });

    it('should clean up memory after form completion', async () => {
      const initialMemory = performanceRunner['getCurrentMemoryUsage']();
      
      // Simulate form completion cycle
      await performanceRunner['simulateFormInteraction']();
      
      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performanceRunner['getCurrentMemoryUsage']();
      
      // Memory should return close to baseline
      expect(finalMemory).toBeLessThan(initialMemory * 1.1);
    });
  });

  describe('Auto-Save Performance Tests', () => {
    it('should handle small form data efficiently', async () => {
      const autoSaveResults = await performanceRunner.testAutoSavePerformance();

      expect(autoSaveResults.smallDataLatency).toBeLessThan(100); // < 100ms
    });

    it('should handle medium form data within acceptable limits', async () => {
      const autoSaveResults = await performanceRunner.testAutoSavePerformance();

      expect(autoSaveResults.mediumDataLatency).toBeLessThan(200); // < 200ms
    });

    it('should handle large form data without blocking UI', async () => {
      const autoSaveResults = await performanceRunner.testAutoSavePerformance();

      expect(autoSaveResults.largeDataLatency).toBeLessThan(500); // < 500ms
    });

    it('should maintain consistent auto-save performance', async () => {
      const autoSaveResults = await performanceRunner.testAutoSavePerformance();

      // Variance should not be too high
      const maxLatency = Math.max(
        autoSaveResults.smallDataLatency,
        autoSaveResults.mediumDataLatency,
        autoSaveResults.largeDataLatency
      );
      const minLatency = Math.min(
        autoSaveResults.smallDataLatency,
        autoSaveResults.mediumDataLatency,
        autoSaveResults.largeDataLatency
      );

      expect(maxLatency / minLatency).toBeLessThan(10); // Less than 10x difference
    });
  });

  describe('Animation Performance Tests', () => {
    it('should maintain 60fps during form animations', async () => {
      const animationResults = await performanceRunner.testAnimationPerformance();

      expect(animationResults.averageFrameRate).toBeGreaterThanOrEqual(55); // Allow 5fps tolerance
      expect(animationResults.smoothnessScore).toBeGreaterThanOrEqual(90); // 90% smooth
    });

    it('should have minimal dropped frames', async () => {
      const animationResults = await performanceRunner.testAnimationPerformance();

      expect(animationResults.droppedFrames).toBeLessThan(5); // Less than 5 dropped frames in 2 seconds
    });

    it('should handle concurrent animations smoothly', async () => {
      // Test multiple animations running simultaneously
      const promises = Array.from({ length: 3 }, () => 
        performanceRunner.testAnimationPerformance()
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.averageFrameRate).toBeGreaterThanOrEqual(50);
        expect(result.smoothnessScore).toBeGreaterThanOrEqual(85);
      });
    });
  });

  describe('Multiple Form Instance Tests', () => {
    it('should scale well with multiple form instances', async () => {
      const scalabilityResults = await performanceRunner.testMultipleFormInstances();

      expect(scalabilityResults.scalabilityScore).toBeLessThan(3); // Less than 3x performance degradation
    });

    it('should maintain memory efficiency with multiple forms', async () => {
      const scalabilityResults = await performanceRunner.testMultipleFormInstances();

      // Memory usage should scale linearly, not exponentially
      const memoryRatio = scalabilityResults.multipleFormMetrics.memoryUsage / 
                         scalabilityResults.singleFormMetrics.memoryUsage;
      
      expect(memoryRatio).toBeLessThan(6); // Less than 6x memory for 5 forms
    });

    it('should handle form switching without performance degradation', async () => {
      const baselineMetrics = await performanceRunner['measureFormPerformance']();
      
      // Simulate switching between multiple forms
      for (let i = 0; i < 5; i++) {
        await performanceRunner['simulateFormInteraction']();
      }
      
      const afterSwitchingMetrics = await performanceRunner['measureFormPerformance']();
      
      // Performance should not degrade significantly
      expect(afterSwitchingMetrics.renderTime).toBeLessThan(baselineMetrics.renderTime * 1.5);
    });
  });

  describe('Component-Specific Performance Tests', () => {
    it('should render BusinessHoursSelector efficiently', async () => {
      const startTime = performance.now();
      
      const mockHours = {
        Monday: { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Tuesday: { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Wednesday: { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Thursday: { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Friday: { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Saturday: { day: 'Saturday', isOpen: false, openTime: '', closeTime: '', isNextDay: false },
        Sunday: { day: 'Sunday', isOpen: false, openTime: '', closeTime: '', isNextDay: false }
      };

      render(
        React.createElement(BusinessHoursSelector, {
          hours: mockHours,
          onHoursChange: () => {}
        })
      );
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render in < 100ms
    });

    it('should handle rapid time picker interactions efficiently', async () => {
      const mockHours = {
        Monday: { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Tuesday: { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Wednesday: { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Thursday: { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Friday: { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
        Saturday: { day: 'Saturday', isOpen: false, openTime: '', closeTime: '', isNextDay: false },
        Sunday: { day: 'Sunday', isOpen: false, openTime: '', closeTime: '', isNextDay: false }
      };

      const onHoursChange = jest.fn();
      const { getByText } = render(
        React.createElement(BusinessHoursSelector, {
          hours: mockHours,
          onHoursChange: onHoursChange
        })
      );

      const startTime = performance.now();
      
      // Simulate rapid interactions with bulk operations button
      for (let i = 0; i < 10; i++) {
        const weekdaysButton = getByText('Weekdays 9-5');
        fireEvent.press(weekdaysButton);
        await waitFor(() => {}, { timeout: 10 });
      }
      
      const interactionTime = performance.now() - startTime;
      expect(interactionTime).toBeLessThan(500); // Should handle 10 interactions in < 500ms
    });
  });

  describe('Comprehensive Performance Report', () => {
    it('should generate a complete performance report', async () => {
      const report = await performanceRunner.generatePerformanceReport();

      expect(report).toHaveProperty('networkTests');
      expect(report).toHaveProperty('memoryTests');
      expect(report).toHaveProperty('autoSaveTests');
      expect(report).toHaveProperty('animationTests');
      expect(report).toHaveProperty('scalabilityTests');
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('recommendations');

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should provide actionable recommendations', async () => {
      const report = await performanceRunner.generatePerformanceReport();

      expect(report.recommendations.length).toBeGreaterThan(0);
      report.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
      });
    });

    it('should achieve acceptable overall performance score', async () => {
      const report = await performanceRunner.generatePerformanceReport();

      // Should achieve at least 70% performance score
      expect(report.overallScore).toBeGreaterThanOrEqual(70);
    });
  });
});
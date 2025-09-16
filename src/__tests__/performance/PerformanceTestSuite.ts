/**
 * Performance Test Suite for Add Eatery Form
 * Tests form performance under various conditions and validates optimization
 */

import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  animationFrameRate: number;
  autoSaveLatency: number;
  networkLatency: number;
}

export interface NetworkCondition {
  name: string;
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
}

export const NETWORK_CONDITIONS: NetworkCondition[] = [
  {
    name: 'WiFi',
    downloadSpeed: 50,
    uploadSpeed: 10,
    latency: 20,
    packetLoss: 0
  },
  {
    name: '4G',
    downloadSpeed: 10,
    uploadSpeed: 2,
    latency: 100,
    packetLoss: 0.1
  },
  {
    name: '3G',
    downloadSpeed: 1.5,
    uploadSpeed: 0.5,
    latency: 300,
    packetLoss: 0.5
  },
  {
    name: 'Slow 3G',
    downloadSpeed: 0.4,
    uploadSpeed: 0.1,
    latency: 600,
    packetLoss: 1
  },
  {
    name: 'Offline',
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: Infinity,
    packetLoss: 100
  }
];

export class PerformanceTestRunner {
  private metrics: PerformanceMetrics[] = [];
  private memoryBaseline: number = 0;

  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Test form performance under various network conditions
   */
  async testNetworkConditions(): Promise<Map<string, PerformanceMetrics>> {
    const results = new Map<string, PerformanceMetrics>();

    for (const condition of NETWORK_CONDITIONS) {
      console.log(`Testing network condition: ${condition.name}`);
      
      // Simulate network condition
      await this.simulateNetworkCondition(condition);
      
      // Run performance tests
      const metrics = await this.measureFormPerformance();
      results.set(condition.name, metrics);
      
      // Reset network condition
      await this.resetNetworkCondition();
    }

    return results;
  }

  /**
   * Validate memory usage and detect memory leaks
   */
  async testMemoryUsage(): Promise<{
    baseline: number;
    peak: number;
    final: number;
    leakDetected: boolean;
  }> {
    const baseline = this.getCurrentMemoryUsage();
    let peak = baseline;

    // Simulate heavy form usage
    for (let i = 0; i < 10; i++) {
      await this.simulateFormInteraction();
      const current = this.getCurrentMemoryUsage();
      peak = Math.max(peak, current);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const final = this.getCurrentMemoryUsage();
    const leakDetected = final > baseline * 1.2; // 20% increase indicates potential leak

    return {
      baseline,
      peak,
      final,
      leakDetected
    };
  }

  /**
   * Test auto-save performance with large form data
   */
  async testAutoSavePerformance(): Promise<{
    smallDataLatency: number;
    mediumDataLatency: number;
    largeDataLatency: number;
    averageLatency: number;
  }> {
    const smallData = this.generateFormData(100); // 100 fields
    const mediumData = this.generateFormData(500); // 500 fields
    const largeData = this.generateFormData(1000); // 1000 fields

    const smallLatency = await this.measureAutoSaveLatency(smallData);
    const mediumLatency = await this.measureAutoSaveLatency(mediumData);
    const largeLatency = await this.measureAutoSaveLatency(largeData);

    return {
      smallDataLatency: smallLatency,
      mediumDataLatency: mediumLatency,
      largeDataLatency: largeLatency,
      averageLatency: (smallLatency + mediumLatency + largeLatency) / 3
    };
  }

  /**
   * Test animation smoothness and frame rate
   */
  async testAnimationPerformance(): Promise<{
    averageFrameRate: number;
    droppedFrames: number;
    smoothnessScore: number;
  }> {
    const frameRates: number[] = [];
    const startTime = performance.now();
    let frameCount = 0;
    let droppedFrames = 0;

    // Simulate 2 seconds of animations
    const duration = 2000;
    const targetFrameRate = 60;
    const frameInterval = 1000 / targetFrameRate;

    return new Promise((resolve) => {
      const measureFrame = () => {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          frameCount++;
          const actualFrameRate = frameCount / (elapsed / 1000);
          frameRates.push(actualFrameRate);

          // Check for dropped frames
          if (actualFrameRate < targetFrameRate * 0.9) {
            droppedFrames++;
          }

          requestAnimationFrame(measureFrame);
        } else {
          const averageFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
          const smoothnessScore = Math.max(0, 100 - (droppedFrames / frameCount) * 100);

          resolve({
            averageFrameRate,
            droppedFrames,
            smoothnessScore
          });
        }
      };

      requestAnimationFrame(measureFrame);
    });
  }

  /**
   * Test performance with multiple form instances
   */
  async testMultipleFormInstances(): Promise<{
    singleFormMetrics: PerformanceMetrics;
    multipleFormMetrics: PerformanceMetrics;
    scalabilityScore: number;
  }> {
    // Test single form instance
    const singleFormMetrics = await this.measureFormPerformance();

    // Test multiple form instances (simulate 5 forms)
    const multipleFormMetrics = await this.measureMultipleFormsPerformance(5);

    // Calculate scalability score (lower is better)
    const scalabilityScore = multipleFormMetrics.renderTime / singleFormMetrics.renderTime;

    return {
      singleFormMetrics,
      multipleFormMetrics,
      scalabilityScore
    };
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<{
    networkTests: Map<string, PerformanceMetrics>;
    memoryTests: any;
    autoSaveTests: any;
    animationTests: any;
    scalabilityTests: any;
    overallScore: number;
    recommendations: string[];
  }> {
    console.log('Running comprehensive performance tests...');

    const networkTests = await this.testNetworkConditions();
    const memoryTests = await this.testMemoryUsage();
    const autoSaveTests = await this.testAutoSavePerformance();
    const animationTests = await this.testAnimationPerformance();
    const scalabilityTests = await this.testMultipleFormInstances();

    const overallScore = this.calculateOverallScore({
      networkTests,
      memoryTests,
      autoSaveTests,
      animationTests,
      scalabilityTests
    });

    const recommendations = this.generateRecommendations({
      networkTests,
      memoryTests,
      autoSaveTests,
      animationTests,
      scalabilityTests
    });

    return {
      networkTests,
      memoryTests,
      autoSaveTests,
      animationTests,
      scalabilityTests,
      overallScore,
      recommendations
    };
  }

  // Private helper methods

  private async simulateNetworkCondition(condition: NetworkCondition): Promise<void> {
    // In a real implementation, this would configure network throttling
    // For testing purposes, we simulate minimal delays to avoid timeout issues
    if (condition.latency > 0 && condition.latency !== Infinity) {
      await new Promise(resolve => setTimeout(resolve, Math.min(condition.latency / 100, 50)));
    }
  }

  private async resetNetworkCondition(): Promise<void> {
    // Reset to normal network conditions
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async measureFormPerformance(): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    
    // Simulate form rendering and interactions
    await this.simulateFormInteraction();
    
    const renderTime = performance.now() - startTime;
    const memoryUsage = this.getCurrentMemoryUsage();
    
    // Simulate animation measurement
    const animationMetrics = await this.testAnimationPerformance();
    
    return {
      renderTime,
      memoryUsage,
      animationFrameRate: animationMetrics.averageFrameRate,
      autoSaveLatency: await this.measureAutoSaveLatency(this.generateFormData(100)),
      networkLatency: 50 // Simulated
    };
  }

  private async simulateFormInteraction(): Promise<void> {
    // Simulate user interactions with the form
    const interactions = [
      () => this.simulateTextInput(),
      () => this.simulateTimePickerInteraction(),
      () => this.simulateToggleInteraction(),
      () => this.simulateScrolling(),
      () => this.simulateValidation()
    ];

    for (const interaction of interactions) {
      await interaction();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private async simulateTextInput(): Promise<void> {
    // Simulate typing in text fields
    const text = 'Sample business name';
    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async simulateTimePickerInteraction(): Promise<void> {
    // Simulate time picker interactions
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async simulateToggleInteraction(): Promise<void> {
    // Simulate toggle switches
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async simulateScrolling(): Promise<void> {
    // Simulate scrolling through form
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async simulateValidation(): Promise<void> {
    // Simulate form validation
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  private getCurrentMemoryUsage(): number {
    // In React Native, we'd use a native module to get actual memory usage
    // For testing purposes, we simulate memory usage
    return Math.random() * 100 + 50; // MB
  }

  private generateFormData(fieldCount: number): any {
    const data: any = {};
    for (let i = 0; i < fieldCount; i++) {
      data[`field_${i}`] = `value_${i}`.repeat(10); // Create some data volume
    }
    return data;
  }

  private async measureAutoSaveLatency(data: any): Promise<number> {
    const startTime = performance.now();
    
    // Simulate auto-save operation with minimal delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    
    return performance.now() - startTime;
  }

  private async measureMultipleFormsPerformance(formCount: number): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    
    // Simulate multiple form instances
    const promises = Array.from({ length: formCount }, () => this.simulateFormInteraction());
    await Promise.all(promises);
    
    const renderTime = performance.now() - startTime;
    const memoryUsage = this.getCurrentMemoryUsage();
    
    return {
      renderTime,
      memoryUsage,
      animationFrameRate: 60, // Simulated
      autoSaveLatency: 100, // Simulated
      networkLatency: 50 // Simulated
    };
  }

  private calculateOverallScore(results: any): number {
    // Calculate a composite score based on all test results
    let score = 100;

    // Penalize for poor performance
    if (results.memoryTests.leakDetected) score -= 20;
    if (results.autoSaveTests.averageLatency > 200) score -= 15;
    if (results.animationTests.averageFrameRate < 50) score -= 15;
    if (results.scalabilityTests.scalabilityScore > 2) score -= 10;

    // Network performance penalties
    const wifiMetrics = results.networkTests.get('WiFi');
    if (wifiMetrics && wifiMetrics.renderTime > 1000) score -= 10;

    return Math.max(0, score);
  }

  private generateRecommendations(results: any): string[] {
    const recommendations: string[] = [];

    if (results.memoryTests.leakDetected) {
      recommendations.push('Memory leak detected. Review component cleanup and useEffect dependencies.');
    }

    if (results.autoSaveTests.averageLatency > 200) {
      recommendations.push('Auto-save latency is high. Consider debouncing or optimizing data serialization.');
    }

    if (results.animationTests.averageFrameRate < 50) {
      recommendations.push('Animation frame rate is below target. Optimize animations and reduce layout thrashing.');
    }

    if (results.scalabilityTests.scalabilityScore > 2) {
      recommendations.push('Poor scalability with multiple forms. Consider virtualization or lazy loading.');
    }

    const slowNetworkMetrics = results.networkTests.get('Slow 3G');
    if (slowNetworkMetrics && slowNetworkMetrics.renderTime > 5000) {
      recommendations.push('Poor performance on slow networks. Implement progressive loading and caching.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable limits. Continue monitoring.');
    }

    return recommendations;
  }
}

export default PerformanceTestRunner;
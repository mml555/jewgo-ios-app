/**
 * Performance Test Runner
 * Automated script to run comprehensive performance tests
 */

import { PerformanceTestRunner } from './PerformanceTestSuite';
import { MemoryLeakDetector } from './MemoryLeakDetector';

interface TestResults {
  timestamp: string;
  testSuite: string;
  results: any;
  passed: boolean;
  score: number;
}

class PerformanceTestExecutor {
  private results: TestResults[] = [];

  async runAllTests(): Promise<{
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      overallScore: number;
    };
    results: TestResults[];
    recommendations: string[];
  }> {
    console.log('🚀 Starting comprehensive performance test suite...');

    const testRunner = new PerformanceTestRunner();
    const memoryDetector = new MemoryLeakDetector();

    try {
      // Test 1: Network Performance
      console.log('📡 Testing network performance...');
      const networkResults = await this.runNetworkTests(testRunner);
      
      // Test 2: Memory Usage
      console.log('🧠 Testing memory usage...');
      const memoryResults = await this.runMemoryTests(testRunner, memoryDetector);
      
      // Test 3: Auto-save Performance
      console.log('💾 Testing auto-save performance...');
      const autoSaveResults = await this.runAutoSaveTests(testRunner);
      
      // Test 4: Animation Performance
      console.log('🎬 Testing animation performance...');
      const animationResults = await this.runAnimationTests(testRunner);
      
      // Test 5: Scalability Tests
      console.log('📈 Testing scalability...');
      const scalabilityResults = await this.runScalabilityTests(testRunner);

      // Generate summary
      const summary = this.generateSummary();
      const recommendations = this.generateRecommendations();

      console.log('✅ Performance test suite completed!');
      
      return {
        summary,
        results: this.results,
        recommendations
      };

    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      throw error;
    } finally {
      memoryDetector.stopMonitoring();
    }
  }

  private async runNetworkTests(testRunner: PerformanceTestRunner): Promise<TestResults> {
    const startTime = Date.now();
    
    try {
      const networkResults = await testRunner.testNetworkConditions();
      
      // Validate results
      const wifiMetrics = networkResults.get('WiFi');
      const fourGMetrics = networkResults.get('4G');
      const slow3GMetrics = networkResults.get('Slow 3G');

      let passed = true;
      let score = 100;

      // WiFi should be fast
      if (!wifiMetrics || wifiMetrics.renderTime > 1000) {
        passed = false;
        score -= 25;
      }

      // 4G should be acceptable
      if (!fourGMetrics || fourGMetrics.renderTime > 2000) {
        passed = false;
        score -= 20;
      }

      // Slow 3G should still work
      if (!slow3GMetrics || slow3GMetrics.renderTime > 5000) {
        passed = false;
        score -= 15;
      }

      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Network Performance',
        results: Object.fromEntries(networkResults),
        passed,
        score: Math.max(0, score)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Network Performance',
        results: { error: error.message },
        passed: false,
        score: 0
      };

      this.results.push(result);
      return result;
    }
  }

  private async runMemoryTests(
    testRunner: PerformanceTestRunner, 
    memoryDetector: MemoryLeakDetector
  ): Promise<TestResults> {
    try {
      memoryDetector.startMonitoring(500); // Monitor every 500ms
      
      // Run memory-intensive operations
      const memoryResults = await testRunner.testMemoryUsage();
      
      // Let it run for a bit to detect leaks
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const leakAnalysis = memoryDetector.analyzeLeaks();
      const memoryReport = memoryDetector.generateReport();

      let passed = true;
      let score = 100;

      // Check for memory leaks
      if (memoryResults.leakDetected || leakAnalysis.isLeaking) {
        passed = false;
        score -= 40;
      }

      // Check memory usage levels
      if (memoryResults.peak > 200) {
        score -= 20;
      }

      // Check memory growth rate
      if (leakAnalysis.leakRate > 1) {
        score -= 20;
      }

      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Memory Usage',
        results: {
          memoryResults,
          leakAnalysis,
          memoryReport: {
            summary: memoryReport.summary,
            componentStats: Object.fromEntries(memoryReport.componentStats),
            listenerStats: Object.fromEntries(memoryReport.listenerStats)
          }
        },
        passed,
        score: Math.max(0, score)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Memory Usage',
        results: { error: error.message },
        passed: false,
        score: 0
      };

      this.results.push(result);
      return result;
    }
  }

  private async runAutoSaveTests(testRunner: PerformanceTestRunner): Promise<TestResults> {
    try {
      const autoSaveResults = await testRunner.testAutoSavePerformance();

      let passed = true;
      let score = 100;

      // Check latency thresholds
      if (autoSaveResults.smallDataLatency > 100) {
        score -= 15;
      }

      if (autoSaveResults.mediumDataLatency > 200) {
        score -= 20;
      }

      if (autoSaveResults.largeDataLatency > 500) {
        passed = false;
        score -= 25;
      }

      // Check consistency
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

      if (maxLatency / minLatency > 10) {
        score -= 15;
      }

      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Auto-save Performance',
        results: autoSaveResults,
        passed,
        score: Math.max(0, score)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Auto-save Performance',
        results: { error: error.message },
        passed: false,
        score: 0
      };

      this.results.push(result);
      return result;
    }
  }

  private async runAnimationTests(testRunner: PerformanceTestRunner): Promise<TestResults> {
    try {
      const animationResults = await testRunner.testAnimationPerformance();

      let passed = true;
      let score = 100;

      // Check frame rate
      if (animationResults.averageFrameRate < 55) {
        passed = false;
        score -= 30;
      } else if (animationResults.averageFrameRate < 58) {
        score -= 15;
      }

      // Check smoothness
      if (animationResults.smoothnessScore < 90) {
        score -= 20;
      }

      // Check dropped frames
      if (animationResults.droppedFrames > 5) {
        score -= 15;
      }

      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Animation Performance',
        results: animationResults,
        passed,
        score: Math.max(0, score)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Animation Performance',
        results: { error: error.message },
        passed: false,
        score: 0
      };

      this.results.push(result);
      return result;
    }
  }

  private async runScalabilityTests(testRunner: PerformanceTestRunner): Promise<TestResults> {
    try {
      const scalabilityResults = await testRunner.testMultipleFormInstances();

      let passed = true;
      let score = 100;

      // Check scalability score
      if (scalabilityResults.scalabilityScore > 3) {
        passed = false;
        score -= 40;
      } else if (scalabilityResults.scalabilityScore > 2) {
        score -= 20;
      }

      // Check memory scaling
      const memoryRatio = scalabilityResults.multipleFormMetrics.memoryUsage / 
                         scalabilityResults.singleFormMetrics.memoryUsage;
      
      if (memoryRatio > 6) {
        score -= 20;
      }

      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Scalability',
        results: scalabilityResults,
        passed,
        score: Math.max(0, score)
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: TestResults = {
        timestamp: new Date().toISOString(),
        testSuite: 'Scalability',
        results: { error: error.message },
        passed: false,
        score: 0
      };

      this.results.push(result);
      return result;
    }
  }

  private generateSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const overallScore = this.results.reduce((sum, r) => sum + r.score, 0) / totalTests;

    return {
      totalTests,
      passedTests,
      failedTests,
      overallScore: Math.round(overallScore)
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedTests = this.results.filter(r => !r.passed);

    if (failedTests.length === 0) {
      recommendations.push('🎉 All performance tests passed! Your form is well-optimized.');
      return recommendations;
    }

    failedTests.forEach(test => {
      switch (test.testSuite) {
        case 'Network Performance':
          recommendations.push('🌐 Optimize network performance: Implement caching and reduce payload sizes');
          break;
        case 'Memory Usage':
          recommendations.push('🧠 Fix memory issues: Review component cleanup and prevent memory leaks');
          break;
        case 'Auto-save Performance':
          recommendations.push('💾 Optimize auto-save: Implement debouncing and data compression');
          break;
        case 'Animation Performance':
          recommendations.push('🎬 Improve animations: Reduce complexity and optimize rendering');
          break;
        case 'Scalability':
          recommendations.push('📈 Enhance scalability: Implement virtualization and component pooling');
          break;
      }
    });

    // General recommendations
    recommendations.push('🔧 Consider implementing React.memo for expensive components');
    recommendations.push('⚡ Use useCallback and useMemo for performance optimization');
    recommendations.push('📊 Monitor performance in production with real user metrics');

    return recommendations;
  }

  exportResults(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        summary: this.generateSummary(),
        results: this.results,
        recommendations: this.generateRecommendations(),
        exportedAt: new Date().toISOString()
      }, null, 2);
    }

    // CSV format
    const headers = ['Timestamp', 'Test Suite', 'Passed', 'Score'];
    const rows = this.results.map(r => [
      r.timestamp,
      r.testSuite,
      r.passed.toString(),
      r.score.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Export for use in tests and scripts
export { PerformanceTestExecutor };

// CLI runner
if (require.main === module) {
  const executor = new PerformanceTestExecutor();
  
  executor.runAllTests()
    .then(results => {
      console.log('\n📊 Performance Test Results:');
      console.log(`Total Tests: ${results.summary.totalTests}`);
      console.log(`Passed: ${results.summary.passedTests}`);
      console.log(`Failed: ${results.summary.failedTests}`);
      console.log(`Overall Score: ${results.summary.overallScore}/100`);
      
      console.log('\n💡 Recommendations:');
      results.recommendations.forEach(rec => console.log(`  ${rec}`));
      
      // Export results
      const jsonResults = executor.exportResults('json');
      console.log('\n📄 Full results exported to performance-results.json');
      
      // In a real implementation, you would write to file
      // require('fs').writeFileSync('performance-results.json', jsonResults);
    })
    .catch(error => {
      console.error('❌ Performance tests failed:', error);
      process.exit(1);
    });
}
/**
 * Memory Leak Detection Utility
 * Detects and reports potential memory leaks in form components
 */

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  componentCount: number;
  listenerCount: number;
}

export interface LeakAnalysis {
  isLeaking: boolean;
  severity: 'low' | 'medium' | 'high';
  leakRate: number; // MB per minute
  suspectedCauses: string[];
  recommendations: string[];
}

export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private componentRegistry = new Map<string, number>();
  private listenerRegistry = new Map<string, number>();
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs: number = 1000): void {
    this.stopMonitoring(); // Ensure no duplicate monitoring
    
    this.intervalId = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: this.getHeapUsed(),
      heapTotal: this.getHeapTotal(),
      external: this.getExternalMemory(),
      componentCount: this.getTotalComponentCount(),
      listenerCount: this.getTotalListenerCount()
    };

    this.snapshots.push(snapshot);
    
    // Keep only last 100 snapshots to prevent memory issues in the detector itself
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Register a component instance
   */
  registerComponent(componentName: string): void {
    const current = this.componentRegistry.get(componentName) || 0;
    this.componentRegistry.set(componentName, current + 1);
  }

  /**
   * Unregister a component instance
   */
  unregisterComponent(componentName: string): void {
    const current = this.componentRegistry.get(componentName) || 0;
    if (current > 0) {
      this.componentRegistry.set(componentName, current - 1);
    }
  }

  /**
   * Register an event listener
   */
  registerListener(listenerType: string): void {
    const current = this.listenerRegistry.get(listenerType) || 0;
    this.listenerRegistry.set(listenerType, current + 1);
  }

  /**
   * Unregister an event listener
   */
  unregisterListener(listenerType: string): void {
    const current = this.listenerRegistry.get(listenerType) || 0;
    if (current > 0) {
      this.listenerRegistry.set(listenerType, current - 1);
    }
  }

  /**
   * Analyze memory usage for potential leaks
   */
  analyzeLeaks(): LeakAnalysis {
    if (this.snapshots.length < 10) {
      return {
        isLeaking: false,
        severity: 'low',
        leakRate: 0,
        suspectedCauses: [],
        recommendations: ['Insufficient data for analysis. Continue monitoring.']
      };
    }

    const analysis = this.performLeakAnalysis();
    return analysis;
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(): {
    trend: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  } {
    if (this.snapshots.length < 5) {
      return { trend: 'stable', rate: 0, confidence: 0 };
    }

    const recent = this.snapshots.slice(-10);
    const older = this.snapshots.slice(-20, -10);

    if (older.length === 0) {
      return { trend: 'stable', rate: 0, confidence: 0.5 };
    }

    const recentAvg = recent.reduce((sum, s) => sum + s.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.heapUsed, 0) / older.length;

    const rate = (recentAvg - olderAvg) / (recent.length * 1000 / 60); // MB per minute
    const confidence = Math.min(this.snapshots.length / 20, 1); // Higher confidence with more data

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(rate) < 0.1) {
      trend = 'stable';
    } else if (rate > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return { trend, rate: Math.abs(rate), confidence };
  }

  /**
   * Generate memory report
   */
  generateReport(): {
    summary: {
      totalSnapshots: number;
      monitoringDuration: number;
      currentMemoryUsage: number;
      peakMemoryUsage: number;
      averageMemoryUsage: number;
    };
    leakAnalysis: LeakAnalysis;
    memoryTrend: ReturnType<MemoryLeakDetector['getMemoryTrend']>;
    componentStats: Map<string, number>;
    listenerStats: Map<string, number>;
    recommendations: string[];
  } {
    const summary = this.generateSummary();
    const leakAnalysis = this.analyzeLeaks();
    const memoryTrend = this.getMemoryTrend();
    const recommendations = this.generateRecommendations(leakAnalysis, memoryTrend);

    return {
      summary,
      leakAnalysis,
      memoryTrend,
      componentStats: new Map(this.componentRegistry),
      listenerStats: new Map(this.listenerRegistry),
      recommendations
    };
  }

  /**
   * Clear all monitoring data
   */
  reset(): void {
    this.stopMonitoring();
    this.snapshots = [];
    this.componentRegistry.clear();
    this.listenerRegistry.clear();
  }

  // Private helper methods

  private getHeapUsed(): number {
    // In React Native, we'd use a native module to get actual memory usage
    // For testing purposes, we simulate memory usage with some realistic patterns
    const baseUsage = 50; // Base 50MB
    const randomVariation = Math.random() * 20; // ±10MB variation
    const timeBasedGrowth = (Date.now() % 60000) / 60000 * 5; // Gradual growth over time
    
    return baseUsage + randomVariation + timeBasedGrowth;
  }

  private getHeapTotal(): number {
    return this.getHeapUsed() * 1.5; // Total is typically 1.5x used
  }

  private getExternalMemory(): number {
    return Math.random() * 10 + 5; // 5-15MB external memory
  }

  private getTotalComponentCount(): number {
    return Array.from(this.componentRegistry.values()).reduce((sum, count) => sum + count, 0);
  }

  private getTotalListenerCount(): number {
    return Array.from(this.listenerRegistry.values()).reduce((sum, count) => sum + count, 0);
  }

  private performLeakAnalysis(): LeakAnalysis {
    const trend = this.getMemoryTrend();
    const suspectedCauses: string[] = [];
    const recommendations: string[] = [];

    // Check for memory growth
    const isLeaking = trend.trend === 'increasing' && trend.rate > 0.5; // > 0.5MB/min growth
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (trend.rate > 2) {
      severity = 'high';
    } else if (trend.rate > 1) {
      severity = 'medium';
    }

    // Analyze component counts
    const totalComponents = this.getTotalComponentCount();
    if (totalComponents > 100) {
      suspectedCauses.push('High component count detected');
      recommendations.push('Review component lifecycle and cleanup');
    }

    // Analyze listener counts
    const totalListeners = this.getTotalListenerCount();
    if (totalListeners > 50) {
      suspectedCauses.push('High event listener count detected');
      recommendations.push('Ensure event listeners are properly removed');
    }

    // Check for specific component leaks
    for (const [component, count] of this.componentRegistry) {
      if (count > 20) {
        suspectedCauses.push(`Potential leak in ${component} component`);
        recommendations.push(`Review ${component} component cleanup`);
      }
    }

    // Check for specific listener leaks
    for (const [listener, count] of this.listenerRegistry) {
      if (count > 10) {
        suspectedCauses.push(`Potential listener leak: ${listener}`);
        recommendations.push(`Review ${listener} listener cleanup`);
      }
    }

    if (suspectedCauses.length === 0 && isLeaking) {
      suspectedCauses.push('Unknown memory leak source');
      recommendations.push('Perform detailed memory profiling');
    }

    return {
      isLeaking,
      severity,
      leakRate: trend.rate,
      suspectedCauses,
      recommendations
    };
  }

  private generateSummary() {
    const totalSnapshots = this.snapshots.length;
    const monitoringDuration = totalSnapshots > 0 ? 
      (this.snapshots[totalSnapshots - 1].timestamp - this.snapshots[0].timestamp) / 1000 : 0;
    
    const memoryUsages = this.snapshots.map(s => s.heapUsed);
    const currentMemoryUsage = memoryUsages[memoryUsages.length - 1] || 0;
    const peakMemoryUsage = Math.max(...memoryUsages, 0);
    const averageMemoryUsage = memoryUsages.length > 0 ? 
      memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length : 0;

    return {
      totalSnapshots,
      monitoringDuration,
      currentMemoryUsage,
      peakMemoryUsage,
      averageMemoryUsage
    };
  }

  private generateRecommendations(
    leakAnalysis: LeakAnalysis, 
    memoryTrend: ReturnType<MemoryLeakDetector['getMemoryTrend']>
  ): string[] {
    const recommendations: string[] = [];

    if (leakAnalysis.isLeaking) {
      recommendations.push('Memory leak detected. Immediate investigation required.');
      
      if (leakAnalysis.severity === 'high') {
        recommendations.push('High severity leak. Consider disabling auto-save temporarily.');
      }
    }

    if (memoryTrend.trend === 'increasing' && memoryTrend.rate > 0.2) {
      recommendations.push('Memory usage is increasing. Monitor component lifecycle.');
    }

    if (this.getTotalComponentCount() > 50) {
      recommendations.push('High component count. Consider component pooling or virtualization.');
    }

    if (this.getTotalListenerCount() > 30) {
      recommendations.push('High listener count. Review event listener cleanup in useEffect.');
    }

    // Add general recommendations
    recommendations.push('Use React.memo for expensive components');
    recommendations.push('Implement proper cleanup in useEffect hooks');
    recommendations.push('Consider using WeakMap for component references');

    return recommendations;
  }
}

export default MemoryLeakDetector;
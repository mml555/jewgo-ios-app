# Performance Testing Suite

This directory contains comprehensive performance testing tools and utilities for the Add Eatery form improvements.

## Overview

The performance testing suite validates that the form meets performance requirements under various conditions:

- **Network Performance**: Tests form behavior under different network conditions (WiFi, 4G, 3G, Slow 3G, Offline)
- **Memory Usage**: Monitors memory consumption and detects potential memory leaks
- **Auto-save Performance**: Validates auto-save functionality with different data sizes
- **Animation Performance**: Ensures smooth animations and maintains target frame rates
- **Scalability**: Tests performance with multiple form instances

## Files

### Core Testing Framework

- **`PerformanceTestSuite.ts`**: Main performance testing framework with comprehensive test methods
- **`MemoryLeakDetector.ts`**: Memory monitoring and leak detection utility
- **`PerformanceBenchmark.test.ts`**: Jest test suite for automated performance validation
- **`runPerformanceTests.ts`**: Automated test runner with reporting capabilities

### React Integration

- **`FormPerformance.test.ts`**: React component-specific performance tests
- **`../hooks/usePerformanceMonitor.ts`**: React hook for real-time performance monitoring
- **`../utils/performanceOptimization.ts`**: Performance optimization utilities

## Usage

### Running Performance Tests

```bash
# Run all performance tests
npm test -- --testPathPattern="performance"

# Run specific performance test
npm test -- --testPathPattern="PerformanceBenchmark"

# Run with coverage
npm test -- --testPathPattern="performance" --coverage
```

### Using Performance Monitor Hook

```typescript
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const MyComponent = () => {
  const {
    startMonitoring,
    stopMonitoring,
    getPerformanceSummary,
    getRecommendations
  } = usePerformanceMonitor('MyComponent');

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  // Get performance data
  const summary = getPerformanceSummary();
  const recommendations = getRecommendations();
};
```

### Memory Leak Detection

```typescript
import { MemoryLeakDetector } from './MemoryLeakDetector';

const detector = new MemoryLeakDetector();

// Start monitoring
detector.startMonitoring(1000); // Every 1 second

// Register components
detector.registerComponent('BusinessHoursSelector');
detector.registerListener('scroll');

// Analyze for leaks
const analysis = detector.analyzeLeaks();
const report = detector.generateReport();

// Cleanup
detector.stopMonitoring();
```

## Performance Targets

### Network Performance
- **WiFi**: Form should load and respond within 1 second
- **4G**: Form should load and respond within 2 seconds  
- **3G**: Form should remain functional within 5 seconds
- **Offline**: Form should provide cached functionality

### Memory Usage
- **Baseline**: < 100MB for basic form operations
- **Peak**: < 200MB during heavy usage
- **Leak Detection**: No memory growth > 20% after operations

### Auto-save Performance
- **Small Data** (< 100 fields): < 100ms latency
- **Medium Data** (< 500 fields): < 200ms latency
- **Large Data** (< 1000 fields): < 500ms latency

### Animation Performance
- **Frame Rate**: Maintain ≥ 55 FPS average
- **Smoothness**: ≥ 90% smoothness score
- **Dropped Frames**: < 5 frames per 2-second animation

### Scalability
- **Multiple Forms**: < 3x performance degradation with 5 instances
- **Memory Scaling**: < 6x memory usage with 5 instances

## Performance Optimization Techniques

### React Optimizations
- `React.memo` for expensive components
- `useCallback` for event handlers
- `useMemo` for computed values
- Debounced validation and auto-save

### Memory Management
- Proper cleanup in `useEffect`
- Component registration/unregistration
- Event listener cleanup
- Avoiding memory leaks in closures

### Animation Optimizations
- Hardware acceleration where possible
- Reduced layout thrashing
- Efficient animation libraries
- Frame rate monitoring

### Network Optimizations
- Request debouncing
- Caching strategies
- Progressive loading
- Offline fallbacks

## Monitoring in Production

The performance monitoring tools can be used in production to track real user performance:

```typescript
// Enable performance monitoring in production
const config = {
  enableMemoryMonitoring: true,
  enableFrameRateMonitoring: true,
  enableInteractionTracking: true,
  monitoringInterval: 5000 // Every 5 seconds
};

const monitor = usePerformanceMonitor('AddEateryForm', config);

// Export performance data for analytics
const performanceData = monitor.exportPerformanceData();
```

## Troubleshooting

### Common Performance Issues

1. **High Memory Usage**
   - Check for memory leaks in components
   - Verify proper cleanup in useEffect
   - Monitor component registration/unregistration

2. **Poor Animation Performance**
   - Reduce animation complexity
   - Check for layout thrashing
   - Optimize rendering performance

3. **Slow Auto-save**
   - Implement debouncing
   - Optimize data serialization
   - Consider compression for large data

4. **Network Issues**
   - Implement proper caching
   - Add offline fallbacks
   - Optimize payload sizes

### Performance Debugging

Use the performance monitoring tools to identify bottlenecks:

```typescript
// Get detailed performance metrics
const summary = getPerformanceSummary();
console.log('Average render time:', summary.averageRenderTime);
console.log('Memory usage:', summary.averageMemoryUsage);
console.log('Performance score:', summary.performanceScore);

// Get actionable recommendations
const recommendations = getRecommendations();
recommendations.forEach(rec => console.log('Recommendation:', rec));
```

## Contributing

When adding new performance tests:

1. Follow the existing test structure
2. Include proper cleanup in `afterEach`
3. Use realistic performance targets
4. Add documentation for new test cases
5. Ensure tests are deterministic and reliable

## References

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Web Performance Metrics](https://web.dev/metrics/)
- [Memory Management Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
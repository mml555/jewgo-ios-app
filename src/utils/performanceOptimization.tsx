/**
 * Performance Optimization Utilities
 * Enhanced utilities for form performance optimization
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debugLog } from './logger';

// Stable callback hook that maintains referential equality
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): T => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
};

// Debounced callback hook for React components
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = [],
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ) as T;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Debounce function with performance tracking
export const createPerformantDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
    trackPerformance?: boolean;
  } = {},
): T & { cancel: () => void; flush: () => void; pending: () => boolean } => {
  const {
    leading = false,
    trailing = true,
    maxWait,
    trackPerformance = false,
  } = options;

  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let result: ReturnType<T>;
  let performanceMetrics: { calls: number; averageDelay: number } = {
    calls: 0,
    averageDelay: 0,
  };

  const invokeFunc = (time: number) => {
    const args = lastArgs!;
    lastArgs = undefined;
    lastInvokeTime = time;

    if (trackPerformance) {
      const actualDelay = time - (lastCallTime || time);
      performanceMetrics.calls++;
      performanceMetrics.averageDelay =
        (performanceMetrics.averageDelay * (performanceMetrics.calls - 1) +
          actualDelay) /
        performanceMetrics.calls;
    }

    result = func.apply(null, args);
    return result;
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number) => {
    if (lastCallTime === undefined) return true;
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    return result;
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
    lastInvokeTime = 0;
    lastCallTime = undefined;
    lastArgs = undefined;
  };

  const flush = () => {
    return timeoutId === null ? result : trailingEdge(Date.now());
  };

  const pending = () => {
    return timeoutId !== null;
  };

  const debounced = ((...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, delay);
        maxTimeoutId = setTimeout(() => invokeFunc(Date.now()), maxWait);
        return leading ? invokeFunc(lastCallTime) : result;
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  }) as T & { cancel: () => void; flush: () => void; pending: () => boolean };

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  // Add performance metrics getter
  Object.defineProperty(debounced, 'performanceMetrics', {
    get: () => ({ ...performanceMetrics }),
    enumerable: false,
  });

  return debounced;
};

// Throttle function with performance optimization
export const createPerformantThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    trackPerformance?: boolean;
  } = {},
): T & { cancel: () => void; flush: () => void } => {
  return createPerformantDebounce(func, delay, {
    ...options,
    maxWait: delay,
  });
};

// Memoization with performance tracking
export const createPerformantMemo = <T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  maxCacheSize: number = 100,
) => {
  const cache = new Map<
    string,
    { result: ReturnType<T>; timestamp: number; hitCount: number }
  >();
  let totalCalls = 0;
  let cacheHits = 0;

  const defaultKeyGenerator = (...args: Parameters<T>) => JSON.stringify(args);
  const getKey = keyGenerator || defaultKeyGenerator;

  const memoized = ((...args: Parameters<T>) => {
    totalCalls++;
    const key = getKey(...args);

    if (cache.has(key)) {
      const cached = cache.get(key)!;
      cached.hitCount++;
      cached.timestamp = Date.now();
      cacheHits++;
      return cached.result;
    }

    const result = func(...args);

    // Manage cache size
    if (cache.size >= maxCacheSize) {
      // Remove least recently used item
      let oldestKey = '';
      let oldestTime = Date.now();

      for (const [k, v] of cache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, { result, timestamp: Date.now(), hitCount: 1 });
    return result;
  }) as T & {
    clearCache: () => void;
    getCacheStats: () => {
      size: number;
      hitRate: number;
      totalCalls: number;
      cacheHits: number;
    };
  };

  memoized.clearCache = () => {
    cache.clear();
    totalCalls = 0;
    cacheHits = 0;
  };

  memoized.getCacheStats = () => ({
    size: cache.size,
    hitRate: totalCalls > 0 ? cacheHits / totalCalls : 0,
    totalCalls,
    cacheHits,
  });

  return memoized;
};

// Performance-optimized batch updater
export class BatchUpdater<T> {
  private updates: T[] = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelay: number;
  private processor: (updates: T[]) => void;
  private performanceMetrics = {
    totalBatches: 0,
    totalUpdates: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0,
  };

  constructor(
    processor: (updates: T[]) => void,
    options: {
      batchSize?: number;
      batchDelay?: number;
    } = {},
  ) {
    this.processor = processor;
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 100;
  }

  add(update: T): void {
    this.updates.push(update);

    if (this.updates.length >= this.batchSize) {
      this.flush();
    } else if (this.timeoutId === null) {
      this.timeoutId = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  flush(): void {
    if (this.updates.length === 0) return;

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const startTime = Date.now();
    const batchToProcess = [...this.updates];
    this.updates = [];

    this.processor(batchToProcess);

    // Update performance metrics
    const processingTime = Date.now() - startTime;
    this.performanceMetrics.totalBatches++;
    this.performanceMetrics.totalUpdates += batchToProcess.length;
    this.performanceMetrics.averageBatchSize =
      this.performanceMetrics.totalUpdates /
      this.performanceMetrics.totalBatches;
    this.performanceMetrics.averageProcessingTime =
      (this.performanceMetrics.averageProcessingTime *
        (this.performanceMetrics.totalBatches - 1) +
        processingTime) /
      this.performanceMetrics.totalBatches;
  }

  getMetrics() {
    return { ...this.performanceMetrics };
  }

  clear(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.updates = [];
  }
}

// React hook for performance monitoring
export const usePerformanceOptimization = (componentName: string) => {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current++;
    const currentTime = Date.now();

    if (lastRenderTime.current > 0) {
      const renderTime = currentTime - lastRenderTime.current;
      renderTimes.current.push(renderTime);

      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }
    }

    lastRenderTime.current = currentTime;
  }); // This useEffect intentionally has no dependencies as it tracks all renders

  const getPerformanceStats = useCallback(() => {
    const averageRenderTime =
      renderTimes.current.length > 0
        ? renderTimes.current.reduce((sum, time) => sum + time, 0) /
          renderTimes.current.length
        : 0;

    return {
      componentName,
      renderCount: renderCount.current,
      averageRenderTime,
      lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
      renderTimes: [...renderTimes.current],
    };
  }, [componentName]);

  // Note: These are utility functions that return the same callbacks/memos
  // They don't actually call hooks inside them to avoid Rules of Hooks violations
  const optimizedCallback = useCallback(
    <T extends (...args: any[]) => any>(callback: T, deps: any[] = []): T => {
      // Just return the callback as-is - the actual memoization should be done at the component level
      return callback;
    },
    [],
  );

  const optimizedMemo = useCallback(
    <T extends unknown>(factory: () => T, deps: any[] = []): T => {
      // Just execute the factory function - the actual memoization should be done at the component level
      return factory();
    },
    [],
  );

  return {
    getPerformanceStats,
    optimizedCallback,
    optimizedMemo,
  };
};

// Virtual scrolling helper for large lists
export class VirtualScrollManager {
  private itemHeight: number;
  private containerHeight: number;
  private totalItems: number;
  private scrollTop: number = 0;
  private overscan: number;

  constructor(options: {
    itemHeight: number;
    containerHeight: number;
    totalItems: number;
    overscan?: number;
  }) {
    this.itemHeight = options.itemHeight;
    this.containerHeight = options.containerHeight;
    this.totalItems = options.totalItems;
    this.overscan = options.overscan || 5;
  }

  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  getVisibleRange(): { start: number; end: number; totalHeight: number } {
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(this.containerHeight / this.itemHeight),
      this.totalItems - 1,
    );

    const start = Math.max(0, visibleStart - this.overscan);
    const end = Math.min(this.totalItems - 1, visibleEnd + this.overscan);

    return {
      start,
      end,
      totalHeight: this.totalItems * this.itemHeight,
    };
  }

  getItemStyle(index: number): {
    position: 'absolute';
    top: number;
    height: number;
  } {
    return {
      position: 'absolute',
      top: index * this.itemHeight,
      height: this.itemHeight,
    };
  }
}

// Performance monitoring decorator
export const withPerformanceMonitoring = <P extends object = {}>(
  Component: React.ComponentType<P>,
  componentName?: string,
) => {
  // In production, just return the component without monitoring
  if (!__DEV__) {
    return Component;
  }

  const WrappedComponent = (props: P) => {
    const name =
      componentName || Component.displayName || Component.name || 'Unknown';
    const { getPerformanceStats } = usePerformanceOptimization(name);

    useEffect(() => {
      // Only log performance stats in development and less frequently
      const stats = getPerformanceStats();
      if (stats.renderCount % 50 === 0) {
        // Reduced frequency from every 10 to every 50 renders
        debugLog(`Performance stats for ${name}:`, stats);
      }
    }, [getPerformanceStats, name]); // Add proper dependencies

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${
    componentName || Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

export default {
  useStableCallback,
  useDebouncedCallback,
  createPerformantDebounce,
  createPerformantThrottle,
  createPerformantMemo,
  BatchUpdater,
  usePerformanceOptimization,
  VirtualScrollManager,
  withPerformanceMonitoring,
};

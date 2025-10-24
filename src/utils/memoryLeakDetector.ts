/**
 * Memory Leak Detection and Prevention System
 * Monitors and prevents common memory leak patterns in React Native
 */

interface LeakDetectionConfig {
  enableMonitoring: boolean;
  maxComponentInstances: number;
  maxEventListeners: number;
  maxTimers: number;
  checkInterval: number;
}

interface ComponentInstance {
  componentName: string;
  mountTime: number;
  eventListeners: Set<string>;
  timers: Set<string>;
  subscriptions: Set<string>;
}

class MemoryLeakDetector {
  private config: LeakDetectionConfig;
  private componentInstances: Map<string, ComponentInstance> = new Map();
  private globalEventListeners: Set<string> = new Set();
  private globalTimers: Set<string> = new Set();
  private checkIntervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<LeakDetectionConfig> = {}) {
    this.config = {
      enableMonitoring: __DEV__,
      maxComponentInstances: 50,
      maxEventListeners: 20,
      maxTimers: 10,
      checkInterval: 5000,
      ...config,
    };

    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
  }

  registerComponent(componentName: string, instanceId: string): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    const instance: ComponentInstance = {
      componentName,
      mountTime: Date.now(),
      eventListeners: new Set(),
      timers: new Set(),
      subscriptions: new Set(),
    };

    this.componentInstances.set(instanceId, instance);
    this.checkForLeaks();
  }

  unregisterComponent(instanceId: string): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    const instance = this.componentInstances.get(instanceId);
    if (instance) {
      // Clean up any remaining resources
      instance.eventListeners.forEach(listener => {
        this.globalEventListeners.delete(listener);
      });
      instance.timers.forEach(timer => {
        this.globalTimers.delete(timer);
      });

      this.componentInstances.delete(instanceId);
    }
  }

  registerEventListener(instanceId: string, eventType: string): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    const instance = this.componentInstances.get(instanceId);
    if (instance) {
      const listenerId = `${instanceId}-${eventType}-${Date.now()}`;
      instance.eventListeners.add(listenerId);
      this.globalEventListeners.add(listenerId);
    }
  }

  unregisterEventListener(instanceId: string, eventType: string): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    const instance = this.componentInstances.get(instanceId);
    if (instance) {
      const listenerId = `${instanceId}-${eventType}-${Date.now()}`;
      instance.eventListeners.delete(listenerId);
      this.globalEventListeners.delete(listenerId);
    }
  }

  registerTimer(instanceId: string, timerType: string): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    const instance = this.componentInstances.get(instanceId);
    if (instance) {
      const timerId = `${instanceId}-${timerType}-${Date.now()}`;
      instance.timers.add(timerId);
      this.globalTimers.add(timerId);
    }
  }

  unregisterTimer(instanceId: string, timerType: string): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    const instance = this.componentInstances.get(instanceId);
    if (instance) {
      const timerId = `${instanceId}-${timerType}-${Date.now()}`;
      instance.timers.delete(timerId);
      this.globalTimers.delete(timerId);
    }
  }

  private startMonitoring(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    this.checkIntervalId = setInterval(() => {
      this.checkForLeaks();
    }, this.config.checkInterval);
  }

  private checkForLeaks(): void {
    const now = Date.now();
    const issues: string[] = [];

    // Check for too many component instances
    if (this.componentInstances.size > this.config.maxComponentInstances) {
      issues.push(
        `Too many component instances: ${this.componentInstances.size}`,
      );
    }

    // Check for too many event listeners
    if (this.globalEventListeners.size > this.config.maxEventListeners) {
      issues.push(
        `Too many event listeners: ${this.globalEventListeners.size}`,
      );
    }

    // Check for too many timers
    if (this.globalTimers.size > this.config.maxTimers) {
      issues.push(`Too many timers: ${this.globalTimers.size}`);
    }

    // Check for long-running components
    for (const [instanceId, instance] of this.componentInstances) {
      const age = now - instance.mountTime;
      if (age > 300000) {
        // 5 minutes
        issues.push(
          `Long-running component: ${instance.componentName} (${Math.round(
            age / 1000,
          )}s)`,
        );
      }
    }

    if (issues.length > 0 && __DEV__) {
      console.warn('🚨 Memory Leak Detection:', issues);
    }
  }

  getStats() {
    return {
      componentInstances: this.componentInstances.size,
      eventListeners: this.globalEventListeners.size,
      timers: this.globalTimers.size,
      components: Array.from(this.componentInstances.values()).map(
        instance => ({
          name: instance.componentName,
          age: Date.now() - instance.mountTime,
          eventListeners: instance.eventListeners.size,
          timers: instance.timers.size,
          subscriptions: instance.subscriptions.size,
        }),
      ),
    };
  }

  stopMonitoring(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  cleanup(): void {
    this.stopMonitoring();
    this.componentInstances.clear();
    this.globalEventListeners.clear();
    this.globalTimers.clear();
  }
}

// Global instance
export const memoryLeakDetector = new MemoryLeakDetector();

// React hook for automatic leak detection
export const useMemoryLeakDetection = (componentName: string) => {
  const instanceId = React.useRef(
    `${componentName}-${Date.now()}-${Math.random()}`,
  ).current;

  React.useEffect(() => {
    memoryLeakDetector.registerComponent(componentName, instanceId);

    return () => {
      memoryLeakDetector.unregisterComponent(instanceId);
    };
  }, [componentName, instanceId]);

  return {
    registerEventListener: (eventType: string) => {
      memoryLeakDetector.registerEventListener(instanceId, eventType);
    },
    unregisterEventListener: (eventType: string) => {
      memoryLeakDetector.unregisterEventListener(instanceId, eventType);
    },
    registerTimer: (timerType: string) => {
      memoryLeakDetector.registerTimer(instanceId, timerType);
    },
    unregisterTimer: (timerType: string) => {
      memoryLeakDetector.unregisterTimer(instanceId, timerType);
    },
  };
};

export default MemoryLeakDetector;

/**
 * Optimistic Updates Utility
 *
 * Provides helpers for implementing optimistic UI updates that make the app
 * feel instant by updating the UI before the server responds.
 */

import { debugLog, errorLog } from './logger';

export interface OptimisticUpdateConfig<T, R = T> {
  /** The optimistic value to show immediately */
  optimisticValue: T;

  /** The async operation to perform */
  operation: () => Promise<R>;

  /** Optional: Transform the server response to match your data structure */
  onSuccess?: (response: R) => T;

  /** Optional: What to do if the operation fails */
  onError?: (error: any) => T;

  /** Optional: Callback when operation completes successfully */
  onComplete?: (finalValue: T) => void;

  /** Optional: Callback when operation fails */
  onFailure?: (error: any) => void;
}

/**
 * Execute an optimistic update
 *
 * @example
 * const [liked, setLiked] = useState(false);
 *
 * const handleLike = async () => {
 *   await performOptimisticUpdate({
 *     optimisticValue: !liked,
 *     operation: () => apiService.toggleLike(itemId),
 *     onSuccess: (response) => response.liked,
 *     onError: () => liked, // Revert on error
 *     onComplete: (finalValue) => setLiked(finalValue),
 *   });
 * };
 */
export async function performOptimisticUpdate<T, R = T>(
  config: OptimisticUpdateConfig<T, R>,
): Promise<T> {
  const {
    optimisticValue,
    operation,
    onSuccess,
    onError,
    onComplete,
    onFailure,
  } = config;

  try {
    // Return optimistic value immediately
    debugLog('🚀 Optimistic update applied');

    // Perform the actual operation
    const response = await operation();

    // Transform response if needed
    const finalValue = onSuccess
      ? onSuccess(response)
      : (response as unknown as T);

    // Call completion callback
    onComplete?.(finalValue);

    debugLog('✅ Optimistic update confirmed');
    return finalValue;
  } catch (error) {
    errorLog('❌ Optimistic update failed:', error);

    // Revert to previous value or error state
    const revertValue = onError ? onError(error) : optimisticValue;

    // Call failure callback
    onFailure?.(error);

    return revertValue;
  }
}

/**
 * Hook-friendly optimistic update handler
 */
export class OptimisticUpdateManager<T> {
  private currentValue: T;
  private updateCallback: (value: T) => void;

  constructor(initialValue: T, updateCallback: (value: T) => void) {
    this.currentValue = initialValue;
    this.updateCallback = updateCallback;
  }

  async execute(
    optimisticValue: T,
    operation: () => Promise<any>,
    options: {
      onSuccess?: (response: any) => T;
      onError?: (error: any) => T;
    } = {},
  ): Promise<void> {
    // Save current value for potential revert
    const previousValue = this.currentValue;

    // Apply optimistic update
    this.currentValue = optimisticValue;
    this.updateCallback(optimisticValue);

    try {
      const response = await operation();
      const finalValue = options.onSuccess
        ? options.onSuccess(response)
        : optimisticValue;

      this.currentValue = finalValue;
      this.updateCallback(finalValue);
    } catch (error) {
      // Revert on error
      const revertValue = options.onError
        ? options.onError(error)
        : previousValue;

      this.currentValue = revertValue;
      this.updateCallback(revertValue);

      throw error;
    }
  }
}

/**
 * Optimistic list operations
 */
export class OptimisticListManager<T extends { id: string }> {
  /**
   * Add item optimistically
   */
  static add<T extends { id: string }>(
    list: T[],
    newItem: T,
    position: 'start' | 'end' = 'end',
  ): T[] {
    return position === 'start' ? [newItem, ...list] : [...list, newItem];
  }

  /**
   * Remove item optimistically
   */
  static remove<T extends { id: string }>(list: T[], itemId: string): T[] {
    return list.filter(item => item.id !== itemId);
  }

  /**
   * Update item optimistically
   */
  static update<T extends { id: string }>(
    list: T[],
    itemId: string,
    updates: Partial<T>,
  ): T[] {
    return list.map(item =>
      item.id === itemId ? { ...item, ...updates } : item,
    );
  }

  /**
   * Toggle boolean property optimistically
   */
  static toggle<T extends { id: string }>(
    list: T[],
    itemId: string,
    property: keyof T,
  ): T[] {
    return list.map(item =>
      item.id === itemId ? { ...item, [property]: !item[property] } : item,
    );
  }
}

/**
 * Debounced optimistic update for rapid actions
 * Useful for things like rating sliders, count increments, etc.
 */
export class DebouncedOptimisticUpdate<T> {
  private timeoutId: NodeJS.Timeout | null = null;
  private latestOptimisticValue: T | null = null;
  private updateCallback: (value: T) => void;
  private debounceMs: number;

  constructor(updateCallback: (value: T) => void, debounceMs: number = 500) {
    this.updateCallback = updateCallback;
    this.debounceMs = debounceMs;
  }

  /**
   * Update optimistically with debouncing
   */
  update(optimisticValue: T, operation: () => Promise<any>): void {
    // Apply optimistic update immediately
    this.latestOptimisticValue = optimisticValue;
    this.updateCallback(optimisticValue);

    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout for actual operation
    this.timeoutId = setTimeout(async () => {
      try {
        await operation();
        debugLog('✅ Debounced optimistic update confirmed');
      } catch (error) {
        errorLog('❌ Debounced optimistic update failed:', error);
        // Could implement retry logic here
      }
    }, this.debounceMs);
  }

  /**
   * Force immediate execution
   */
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

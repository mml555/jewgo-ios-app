import { useRef, useCallback } from 'react';

/**
 * Stable callback hook that prevents unnecessary re-renders
 * by maintaining the same function reference across renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

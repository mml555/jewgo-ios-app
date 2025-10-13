import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorLog, warnLog, debugLog } from '../utils/logger';

/**
 * SafeAsyncStorage - A robust wrapper around AsyncStorage
 *
 * Provides:
 * - Automatic error handling for all operations
 * - Fallback values on failures
 * - JSON serialization/deserialization with error handling
 * - Comprehensive logging for debugging
 */
class SafeAsyncStorage {
  /**
   * Get a string item from storage
   * @param key Storage key
   * @param fallback Fallback value if item doesn't exist or operation fails
   * @returns The stored value or fallback
   */
  async getItem(
    key: string,
    fallback: string | null = null,
  ): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null ? value : fallback;
    } catch (error) {
      errorLog(`SafeAsyncStorage.getItem failed for key "${key}":`, error);
      return fallback;
    }
  }

  /**
   * Set a string item in storage
   * @param key Storage key
   * @param value Value to store
   * @returns true if successful, false otherwise
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      errorLog(`SafeAsyncStorage.setItem failed for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove an item from storage
   * @param key Storage key
   * @returns true if successful, false otherwise
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      errorLog(`SafeAsyncStorage.removeItem failed for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get and parse a JSON object from storage
   * @param key Storage key
   * @param fallback Fallback value if item doesn't exist or parsing fails
   * @returns The parsed object or fallback
   */
  async getJSON<T>(key: string, fallback: T | null = null): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      try {
        const parsed = JSON.parse(value);
        return parsed as T;
      } catch (parseError) {
        warnLog(
          `SafeAsyncStorage.getJSON parse failed for key "${key}":`,
          parseError,
        );
        // Try to remove corrupted data
        await this.removeItem(key);
        return fallback;
      }
    } catch (error) {
      errorLog(`SafeAsyncStorage.getJSON failed for key "${key}":`, error);
      return fallback;
    }
  }

  /**
   * Stringify and store a JSON object
   * @param key Storage key
   * @param value Object to store
   * @returns true if successful, false otherwise
   */
  async setJSON<T>(key: string, value: T): Promise<boolean> {
    try {
      const stringified = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringified);
      return true;
    } catch (error) {
      errorLog(`SafeAsyncStorage.setJSON failed for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get multiple items at once
   * @param keys Array of storage keys
   * @returns Object mapping keys to values (null for missing/failed items)
   */
  async multiGet(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      const mapped: Record<string, string | null> = {};

      result.forEach(([key, value]) => {
        mapped[key] = value;
      });

      return mapped;
    } catch (error) {
      errorLog('SafeAsyncStorage.multiGet failed:', error);
      // Return empty object on failure
      const fallback: Record<string, string | null> = {};
      keys.forEach(key => {
        fallback[key] = null;
      });
      return fallback;
    }
  }

  /**
   * Set multiple items at once
   * @param keyValuePairs Array of [key, value] pairs
   * @returns true if successful, false otherwise
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<boolean> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
      return true;
    } catch (error) {
      errorLog('SafeAsyncStorage.multiSet failed:', error);
      return false;
    }
  }

  /**
   * Remove multiple items at once
   * @param keys Array of storage keys
   * @returns true if successful, false otherwise
   */
  async multiRemove(keys: string[]): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      errorLog('SafeAsyncStorage.multiRemove failed:', error);
      return false;
    }
  }

  /**
   * Clear all storage (use with caution!)
   * @returns true if successful, false otherwise
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      if (__DEV__) {
        debugLog('SafeAsyncStorage: All storage cleared');
      }
      return true;
    } catch (error) {
      errorLog('SafeAsyncStorage.clear failed:', error);
      return false;
    }
  }

  /**
   * Get all keys in storage
   * @returns Array of keys or empty array on failure
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      errorLog('SafeAsyncStorage.getAllKeys failed:', error);
      return [];
    }
  }

  /**
   * Merge an existing JSON object with new values
   * @param key Storage key
   * @param value Object to merge
   * @returns true if successful, false otherwise
   */
  async mergeJSON<T extends object>(
    key: string,
    value: Partial<T>,
  ): Promise<boolean> {
    try {
      const existing = await this.getJSON<T>(key, {} as T);
      const merged = { ...existing, ...value };
      return await this.setJSON(key, merged);
    } catch (error) {
      errorLog(`SafeAsyncStorage.mergeJSON failed for key "${key}":`, error);
      return false;
    }
  }
}

// Export singleton instance
export const safeAsyncStorage = new SafeAsyncStorage();

// Also export the class for testing/custom instances
export default SafeAsyncStorage;

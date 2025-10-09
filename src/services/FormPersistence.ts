import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListingFormData } from '../screens/AddCategoryScreen';
import { debugLog, errorLog } from '../utils/logger';

// Form persistence configuration
const FORM_STORAGE_KEY = 'add_eatery_form_data';
const FORM_METADATA_KEY = 'add_eatery_form_metadata';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const MAX_SAVE_HISTORY = 5; // Keep last 5 saves for recovery

// Form metadata interface
export interface FormMetadata {
  lastSaved: string; // ISO timestamp
  currentStep: number;
  version: string; // For schema migration
  saveCount: number;
  isComplete: boolean;
  userId?: string; // For multi-user support
}

// Save status enum
export enum SaveStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
}

// Form persistence service
export class FormPersistenceService {
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private saveStatus: SaveStatus = SaveStatus.IDLE;
  private saveStatusCallbacks: ((status: SaveStatus) => void)[] = [];
  private currentVersion = '1.0.0';
  private statusResetTimer: NodeJS.Timeout | null = null;

  // Subscribe to save status changes
  onSaveStatusChange(callback: (status: SaveStatus) => void): () => void {
    this.saveStatusCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.saveStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.saveStatusCallbacks.splice(index, 1);
      }
    };
  }

  // Update save status and notify subscribers
  private updateSaveStatus(status: SaveStatus): void {
    this.saveStatus = status;
    this.saveStatusCallbacks.forEach(callback => callback(status));
  }

  // Get current save status
  getSaveStatus(): SaveStatus {
    return this.saveStatus;
  }

  // Save form data to AsyncStorage
  async saveFormData(
    formData: Partial<ListingFormData>,
    currentStep: number,
    isComplete: boolean = false,
  ): Promise<void> {
    try {
      this.updateSaveStatus(SaveStatus.SAVING);

      // Get existing data to merge
      const existingData = await this.loadFormData();
      const mergedData = { ...existingData, ...formData };

      // Create metadata
      const metadata: FormMetadata = {
        lastSaved: new Date().toISOString(),
        currentStep,
        version: this.currentVersion,
        saveCount: ((await this.getMetadata())?.saveCount || 0) + 1,
        isComplete,
      };

      // Save data and metadata
      await Promise.all([
        AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(mergedData)),
        AsyncStorage.setItem(FORM_METADATA_KEY, JSON.stringify(metadata)),
      ]);

      // Save to history for recovery
      await this.saveToHistory(mergedData as any, metadata);

      this.updateSaveStatus(SaveStatus.SAVED);

      // Clear any existing status reset timer
      if (this.statusResetTimer) {
        clearTimeout(this.statusResetTimer);
      }

      // Reset to idle after 2 seconds
      this.statusResetTimer = setTimeout(() => {
        if (this.saveStatus === SaveStatus.SAVED) {
          this.updateSaveStatus(SaveStatus.IDLE);
        }
        this.statusResetTimer = null;
      }, 2000);
    } catch (error) {
      errorLog('Error saving form data:', error);
      this.updateSaveStatus(SaveStatus.ERROR);

      // Clear any existing status reset timer
      if (this.statusResetTimer) {
        clearTimeout(this.statusResetTimer);
      }

      // Reset to idle after 3 seconds
      this.statusResetTimer = setTimeout(() => {
        if (this.saveStatus === SaveStatus.ERROR) {
          this.updateSaveStatus(SaveStatus.IDLE);
        }
        this.statusResetTimer = null;
      }, 3000);

      throw error;
    }
  }

  // Load form data from AsyncStorage
  async loadFormData(): Promise<ListingFormData | null> {
    try {
      const data = await AsyncStorage.getItem(FORM_STORAGE_KEY);
      if (!data) return null;

      const parsedData = JSON.parse(data) as ListingFormData;

      // Perform schema migration if needed
      return await this.migrateFormData(parsedData);
    } catch (error) {
      errorLog('Error loading form data:', error);
      return null;
    }
  }

  // Get form metadata
  async getMetadata(): Promise<FormMetadata | null> {
    try {
      const metadata = await AsyncStorage.getItem(FORM_METADATA_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      errorLog('Error loading form metadata:', error);
      return null;
    }
  }

  // Clear form data
  async clearFormData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(FORM_STORAGE_KEY),
        AsyncStorage.removeItem(FORM_METADATA_KEY),
      ]);

      // Clear history as well
      await this.clearHistory();

      this.updateSaveStatus(SaveStatus.IDLE);
    } catch (error) {
      errorLog('Error clearing form data:', error);
      throw error;
    }
  }

  // Get last saved step
  async getLastSavedStep(): Promise<number> {
    const metadata = await this.getMetadata();
    return metadata?.currentStep || 1;
  }

  // Check if form has saved data
  async hasSavedData(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(FORM_STORAGE_KEY);
      return data !== null;
    } catch (error) {
      errorLog('Error checking for saved data:', error);
      return false;
    }
  }

  // Start auto-save timer
  startAutoSave(
    getFormData: () => Partial<ListingFormData>,
    getCurrentStep: () => number,
    isFormComplete: () => boolean = () => false,
  ): void {
    this.stopAutoSave(); // Clear any existing timer

    this.autoSaveTimer = setInterval(async () => {
      try {
        const formData = getFormData();
        const currentStep = getCurrentStep();
        const isComplete = isFormComplete();

        // Only auto-save if there's meaningful data
        if (this.hasMinimalData(formData)) {
          await this.saveFormData(formData, currentStep, isComplete);
        }
      } catch (error) {
        errorLog('Auto-save error:', error);
      }
    }, AUTO_SAVE_INTERVAL);
  }

  // Stop auto-save timer
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    // Also clear status reset timer
    if (this.statusResetTimer) {
      clearTimeout(this.statusResetTimer);
      this.statusResetTimer = null;
    }
  }

  // Check if form data has minimal required information for saving
  private hasMinimalData(formData: Partial<ListingFormData>): boolean {
    return !!(
      formData.name?.trim() ||
      formData.address?.trim() ||
      formData.phone?.trim() ||
      formData.business_email?.trim() ||
      formData.short_description?.trim()
    );
  }

  // Save to history for recovery
  private async saveToHistory(
    formData: ListingFormData,
    metadata: FormMetadata,
  ): Promise<void> {
    try {
      const historyKey = `${FORM_STORAGE_KEY}_history`;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      let history: Array<{ data: ListingFormData; metadata: FormMetadata }> =
        [];

      if (existingHistory) {
        history = JSON.parse(existingHistory);
      }

      // Add new save to history
      history.unshift({ data: formData, metadata });

      // Keep only the last MAX_SAVE_HISTORY saves
      if (history.length > MAX_SAVE_HISTORY) {
        history = history.slice(0, MAX_SAVE_HISTORY);
      }

      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      errorLog('Error saving to history:', error);
      // Don't throw - history is not critical
    }
  }

  // Get save history for recovery
  async getSaveHistory(): Promise<
    Array<{ data: ListingFormData; metadata: FormMetadata }>
  > {
    try {
      const historyKey = `${FORM_STORAGE_KEY}_history`;
      const history = await AsyncStorage.getItem(historyKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      errorLog('Error loading save history:', error);
      return [];
    }
  }

  // Clear save history
  private async clearHistory(): Promise<void> {
    try {
      const historyKey = `${FORM_STORAGE_KEY}_history`;
      await AsyncStorage.removeItem(historyKey);
    } catch (error) {
      errorLog('Error clearing history:', error);
      // Don't throw - not critical
    }
  }

  // Restore from a specific history entry
  async restoreFromHistory(index: number): Promise<ListingFormData | null> {
    try {
      const history = await this.getSaveHistory();
      if (index >= 0 && index < history.length) {
        const entry = history[index];

        // Save as current data
        await this.saveFormData(
          entry.data,
          entry.metadata.currentStep,
          entry.metadata.isComplete,
        );

        return entry.data;
      }
      return null;
    } catch (error) {
      errorLog('Error restoring from history:', error);
      return null;
    }
  }

  // Migrate form data for schema changes
  private async migrateFormData(data: any): Promise<ListingFormData> {
    const metadata = await this.getMetadata();
    const dataVersion = metadata?.version || '1.0.0';

    // If versions match, no migration needed
    if (dataVersion === this.currentVersion) {
      return data as ListingFormData;
    }

    // Perform migrations based on version
    let migratedData = { ...data };

    // Example migration from version 1.0.0 to 1.1.0
    if (dataVersion === '1.0.0' && this.currentVersion === '1.1.0') {
      // Add any new fields with defaults
      migratedData = {
        ...migratedData,
        // Add new fields here with default values
      };
    }

    // Update version after migration
    if (metadata) {
      metadata.version = this.currentVersion;
      await AsyncStorage.setItem(FORM_METADATA_KEY, JSON.stringify(metadata));
    }

    return migratedData as ListingFormData;
  }

  // Get form completion percentage
  async getFormCompletionPercentage(): Promise<number> {
    const formData = await this.loadFormData();
    if (!formData) return 0;

    // Define required fields for completion calculation
    const requiredFields = [
      'name',
      'address',
      'phone',
      'business_email',
      'listing_type',
      'kosher_category',
      'short_description',
      'business_hours',
    ];

    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof ListingFormData];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && String(value).trim().length > 0;
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  // Export form data for debugging or backup
  async exportFormData(): Promise<string> {
    try {
      const formData = await this.loadFormData();
      const metadata = await this.getMetadata();
      const history = await this.getSaveHistory();

      return JSON.stringify(
        {
          formData,
          metadata,
          history,
          exportedAt: new Date().toISOString(),
        },
        null,
        2,
      );
    } catch (error) {
      errorLog('Error exporting form data:', error);
      throw error;
    }
  }

  // Import form data from backup
  async importFormData(jsonData: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonData);

      if (imported.formData) {
        await this.saveFormData(
          imported.formData,
          imported.metadata?.currentStep || 1,
          imported.metadata?.isComplete || false,
        );
      }

      // Restore history if available
      if (imported.history) {
        const historyKey = `${FORM_STORAGE_KEY}_history`;
        await AsyncStorage.setItem(
          historyKey,
          JSON.stringify(imported.history),
        );
      }
    } catch (error) {
      errorLog('Error importing form data:', error);
      throw error;
    }
  }
}

// Default service instance
export const formPersistenceService = new FormPersistenceService();

// Convenience hooks and utilities
export const useFormPersistence = () => {
  return formPersistenceService;
};

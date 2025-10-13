import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  formPersistenceService,
  SaveStatus,
  FormMetadata,
} from '../services/FormPersistence';
import { ListingFormData } from '../screens/AddCategoryScreen';
import { errorLog } from '../utils/logger';

interface UseFormAutoSaveOptions {
  enabled?: boolean;
  saveOnAppBackground?: boolean;
  saveOnStepChange?: boolean;
  debounceMs?: number;
}

interface UseFormAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  saveCount: number;
  completionPercentage: number;
  hasSavedData: boolean;
  saveNow: () => Promise<void>;
  loadSavedData: () => Promise<ListingFormData | null>;
  clearSavedData: () => Promise<void>;
  getSaveHistory: () => Promise<
    Array<{ data: ListingFormData; metadata: FormMetadata }>
  >;
  restoreFromHistory: (index: number) => Promise<ListingFormData | null>;
}

export const useFormAutoSave = (
  formData: Partial<ListingFormData>,
  currentStep: number,
  isFormComplete: boolean = false,
  options: UseFormAutoSaveOptions = {},
): UseFormAutoSaveReturn => {
  const {
    enabled = true,
    saveOnAppBackground = true,
    saveOnStepChange = true,
    debounceMs = 1000,
  } = options;

  // State
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.IDLE);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Refs for debouncing and tracking
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastStepRef = useRef(currentStep);
  const isInitializedRef = useRef(false);

  // Initialize and load existing data
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if there's saved data
        const hasData = await formPersistenceService.hasSavedData();
        setHasSavedData(hasData);

        // Load metadata if available
        const metadata = await formPersistenceService.getMetadata();
        if (metadata) {
          setLastSaved(new Date(metadata.lastSaved));
          setSaveCount(metadata.saveCount);
        }

        // Calculate completion percentage
        const percentage =
          await formPersistenceService.getFormCompletionPercentage();
        setCompletionPercentage(percentage);

        isInitializedRef.current = true;
      } catch (error) {
        errorLog('Error initializing form auto-save:', error);
      }
    };

    initialize();
  }, []);

  // Subscribe to save status changes
  useEffect(() => {
    const unsubscribe = formPersistenceService.onSaveStatusChange(status => {
      setSaveStatus(status);
    });

    return unsubscribe;
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(async () => {
    if (!enabled || !isInitializedRef.current) return;

    try {
      await formPersistenceService.saveFormData(
        formData,
        currentStep,
        isFormComplete,
      );

      // Update state
      setLastSaved(new Date());
      setHasSavedData(true);

      // Update completion percentage
      const percentage =
        await formPersistenceService.getFormCompletionPercentage();
      setCompletionPercentage(percentage);

      // Update metadata
      const metadata = await formPersistenceService.getMetadata();
      if (metadata) {
        setSaveCount(metadata.saveCount);
      }
    } catch (error) {
      errorLog('Error in debounced save:', error);
    }
  }, [formData, currentStep, isFormComplete, enabled]);

  // Trigger save with debouncing - use ref to avoid recreating
  const triggerSaveRef = useRef<() => void>(() => {});
  triggerSaveRef.current = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(debouncedSave, debounceMs);
  };

  const triggerSave = useCallback(() => {
    triggerSaveRef.current?.();
  }, []); // Empty deps - stable callback

  // Save immediately without debouncing
  const saveNow = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await debouncedSave();
  }, [debouncedSave]);

  // Auto-save when form data changes - now with stable triggerSave
  useEffect(() => {
    if (enabled && isInitializedRef.current) {
      triggerSaveRef.current?.();
    }
  }, [formData, enabled]); // Removed triggerSave from deps

  // Save when step changes
  useEffect(() => {
    if (
      saveOnStepChange &&
      currentStep !== lastStepRef.current &&
      isInitializedRef.current
    ) {
      saveNow();
      lastStepRef.current = currentStep;
    }
  }, [currentStep, saveOnStepChange, saveNow]);

  // Save when app goes to background
  useEffect(() => {
    if (!saveOnAppBackground) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        saveNow();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [saveOnAppBackground, saveNow]);

  // Start auto-save service - use refs to avoid recreating on every change
  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);
  const isFormCompleteRef = useRef(isFormComplete);

  // Update refs on change
  useEffect(() => {
    formDataRef.current = formData;
    currentStepRef.current = currentStep;
    isFormCompleteRef.current = isFormComplete;
  }, [formData, currentStep, isFormComplete]);

  // Start auto-save service - now stable
  useEffect(() => {
    if (enabled) {
      formPersistenceService.startAutoSave(
        () => formDataRef.current,
        () => currentStepRef.current,
        () => isFormCompleteRef.current,
      );
    }

    return () => {
      formPersistenceService.stopAutoSave();
    };
  }, [enabled]); // Only depends on enabled flag

  // Cleanup debounce timer and service on unmount
  useEffect(() => {
    return () => {
      // Clear debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Cleanup service resources
      formPersistenceService.cleanup();
    };
  }, []);

  // Load saved data
  const loadSavedData =
    useCallback(async (): Promise<ListingFormData | null> => {
      try {
        return await formPersistenceService.loadFormData();
      } catch (error) {
        errorLog('Error loading saved data:', error);
        return null;
      }
    }, []);

  // Clear saved data
  const clearSavedData = useCallback(async (): Promise<void> => {
    try {
      await formPersistenceService.clearFormData();
      setHasSavedData(false);
      setLastSaved(null);
      setSaveCount(0);
      setCompletionPercentage(0);
    } catch (error) {
      errorLog('Error clearing saved data:', error);
      throw error;
    }
  }, []);

  // Get save history
  const getSaveHistory = useCallback(async () => {
    try {
      return await formPersistenceService.getSaveHistory();
    } catch (error) {
      errorLog('Error getting save history:', error);
      return [];
    }
  }, []);

  // Restore from history
  const restoreFromHistory = useCallback(
    async (index: number): Promise<ListingFormData | null> => {
      try {
        const restored = await formPersistenceService.restoreFromHistory(index);
        if (restored) {
          setHasSavedData(true);
          setLastSaved(new Date());

          // Update completion percentage
          const percentage =
            await formPersistenceService.getFormCompletionPercentage();
          setCompletionPercentage(percentage);
        }
        return restored;
      } catch (error) {
        errorLog('Error restoring from history:', error);
        return null;
      }
    },
    [],
  );

  return {
    saveStatus,
    lastSaved,
    saveCount,
    completionPercentage,
    hasSavedData,
    saveNow,
    loadSavedData,
    clearSavedData,
    getSaveHistory,
    restoreFromHistory,
  };
};

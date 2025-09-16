import { renderHook, act } from '@testing-library/react-hooks';
import { AppState } from 'react-native';
import { useFormAutoSave } from '../useFormAutoSave';
import { formPersistenceService, SaveStatus } from '../../services/FormPersistence';
import { ListingFormData } from '../../screens/AddCategoryScreen';

// Mock the FormPersistenceService
jest.mock('../../services/FormPersistence');
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  addEventListener: jest.fn(),
  currentState: 'active',
}));

const mockFormPersistenceService = formPersistenceService as jest.Mocked<typeof formPersistenceService>;

describe('useFormAutoSave', () => {
  const sampleFormData: Partial<ListingFormData> = {
    name: 'Test Restaurant',
    address: '123 Main St',
    phone: '1234567890',
    business_email: 'test@restaurant.com',
  };

  const emptyFormData = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mock implementations
    mockFormPersistenceService.hasSavedData.mockResolvedValue(false);
    mockFormPersistenceService.getMetadata.mockResolvedValue(null);
    mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(0);
    mockFormPersistenceService.onSaveStatusChange.mockReturnValue(() => {});
    mockFormPersistenceService.saveFormData.mockResolvedValue();
    mockFormPersistenceService.startAutoSave.mockImplementation(() => {});
    mockFormPersistenceService.stopAutoSave.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with default state', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      expect(result.current.saveStatus).toBe(SaveStatus.IDLE);
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.saveCount).toBe(0);
      expect(result.current.completionPercentage).toBe(0);
      expect(result.current.hasSavedData).toBe(false);
    });

    it('loads existing metadata on initialization', async () => {
      const mockMetadata = {
        lastSaved: '2023-01-01T00:00:00.000Z',
        currentStep: 2,
        version: '1.0.0',
        saveCount: 5,
        isComplete: false,
      };

      mockFormPersistenceService.hasSavedData.mockResolvedValue(true);
      mockFormPersistenceService.getMetadata.mockResolvedValue(mockMetadata);
      mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(75);

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      expect(result.current.hasSavedData).toBe(true);
      expect(result.current.lastSaved).toEqual(new Date(mockMetadata.lastSaved));
      expect(result.current.saveCount).toBe(5);
      expect(result.current.completionPercentage).toBe(75);
    });

    it('subscribes to save status changes', async () => {
      const mockUnsubscribe = jest.fn();
      mockFormPersistenceService.onSaveStatusChange.mockReturnValue(mockUnsubscribe);

      const { unmount, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      expect(mockFormPersistenceService.onSaveStatusChange).toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Auto-Save Functionality', () => {
    it('starts auto-save service when enabled', async () => {
      const { waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false, { enabled: true })
      );

      await waitForNextUpdate();

      expect(mockFormPersistenceService.startAutoSave).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('does not start auto-save when disabled', async () => {
      const { waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false, { enabled: false })
      );

      await waitForNextUpdate();

      expect(mockFormPersistenceService.startAutoSave).not.toHaveBeenCalled();
    });

    it('stops auto-save on unmount', async () => {
      const { unmount, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      unmount();

      expect(mockFormPersistenceService.stopAutoSave).toHaveBeenCalled();
    });

    it('triggers save when form data changes', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ formData }) => useFormAutoSave(formData, 1, false),
        { initialProps: { formData: sampleFormData } }
      );

      await waitForNextUpdate();

      // Change form data
      const updatedData = { ...sampleFormData, name: 'Updated Restaurant' };
      rerender({ formData: updatedData });

      act(() => {
        jest.advanceTimersByTime(1000); // Default debounce
      });

      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
        updatedData,
        1,
        false
      );
    });

    it('debounces rapid form changes', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ formData }) => useFormAutoSave(formData, 1, false, { debounceMs: 500 }),
        { initialProps: { formData: sampleFormData } }
      );

      await waitForNextUpdate();

      // Make rapid changes
      rerender({ formData: { ...sampleFormData, name: 'Name 1' } });
      rerender({ formData: { ...sampleFormData, name: 'Name 2' } });
      rerender({ formData: { ...sampleFormData, name: 'Name 3' } });

      // Should not save immediately
      expect(mockFormPersistenceService.saveFormData).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should save after debounce
      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step Change Handling', () => {
    it('saves immediately when step changes', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ currentStep }) => useFormAutoSave(sampleFormData, currentStep, false, { saveOnStepChange: true }),
        { initialProps: { currentStep: 1 } }
      );

      await waitForNextUpdate();

      // Change step
      rerender({ currentStep: 2 });

      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
        sampleFormData,
        2,
        false
      );
    });

    it('does not save on step change when disabled', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ currentStep }) => useFormAutoSave(sampleFormData, currentStep, false, { saveOnStepChange: false }),
        { initialProps: { currentStep: 1 } }
      );

      await waitForNextUpdate();

      rerender({ currentStep: 2 });

      expect(mockFormPersistenceService.saveFormData).not.toHaveBeenCalled();
    });
  });

  describe('App State Handling', () => {
    it('saves when app goes to background', async () => {
      const mockAddEventListener = AppState.addEventListener as jest.MockedFunction<typeof AppState.addEventListener>;
      let appStateCallback: (nextAppState: string) => void;

      mockAddEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          appStateCallback = callback;
        }
        return { remove: jest.fn() };
      });

      const { waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false, { saveOnAppBackground: true })
      );

      await waitForNextUpdate();

      // Simulate app going to background
      act(() => {
        appStateCallback!('background');
      });

      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
        sampleFormData,
        1,
        false
      );
    });

    it('saves when app becomes inactive', async () => {
      const mockAddEventListener = AppState.addEventListener as jest.MockedFunction<typeof AppState.addEventListener>;
      let appStateCallback: (nextAppState: string) => void;

      mockAddEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          appStateCallback = callback;
        }
        return { remove: jest.fn() };
      });

      const { waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false, { saveOnAppBackground: true })
      );

      await waitForNextUpdate();

      act(() => {
        appStateCallback!('inactive');
      });

      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
        sampleFormData,
        1,
        false
      );
    });

    it('does not save on app state change when disabled', async () => {
      const mockAddEventListener = AppState.addEventListener as jest.MockedFunction<typeof AppState.addEventListener>;

      const { waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false, { saveOnAppBackground: false })
      );

      await waitForNextUpdate();

      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Manual Save Operations', () => {
    it('saves immediately when saveNow is called', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
        sampleFormData,
        1,
        false
      );
    });

    it('cancels debounced save when saveNow is called', async () => {
      const { result, rerender, waitForNextUpdate } = renderHook(
        ({ formData }) => useFormAutoSave(formData, 1, false, { debounceMs: 1000 }),
        { initialProps: { formData: sampleFormData } }
      );

      await waitForNextUpdate();

      // Trigger debounced save
      rerender({ formData: { ...sampleFormData, name: 'Changed' } });

      // Call saveNow before debounce completes
      await act(async () => {
        await result.current.saveNow();
      });

      // Should save immediately, not wait for debounce
      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(1);

      // Advance past debounce time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not save again
      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Loading and Management', () => {
    it('loads saved data', async () => {
      const mockSavedData = { name: 'Saved Restaurant' } as ListingFormData;
      mockFormPersistenceService.loadFormData.mockResolvedValue(mockSavedData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      const loadedData = await result.current.loadSavedData();

      expect(loadedData).toEqual(mockSavedData);
      expect(mockFormPersistenceService.loadFormData).toHaveBeenCalled();
    });

    it('clears saved data', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.clearSavedData();
      });

      expect(mockFormPersistenceService.clearFormData).toHaveBeenCalled();
      expect(result.current.hasSavedData).toBe(false);
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.saveCount).toBe(0);
      expect(result.current.completionPercentage).toBe(0);
    });

    it('gets save history', async () => {
      const mockHistory = [
        {
          data: sampleFormData as ListingFormData,
          metadata: {
            lastSaved: '2023-01-01T00:00:00.000Z',
            currentStep: 1,
            version: '1.0.0',
            saveCount: 1,
            isComplete: false,
          },
        },
      ];

      mockFormPersistenceService.getSaveHistory.mockResolvedValue(mockHistory);

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      const history = await result.current.getSaveHistory();

      expect(history).toEqual(mockHistory);
      expect(mockFormPersistenceService.getSaveHistory).toHaveBeenCalled();
    });

    it('restores from history', async () => {
      const mockRestoredData = { name: 'Restored Restaurant' } as ListingFormData;
      mockFormPersistenceService.restoreFromHistory.mockResolvedValue(mockRestoredData);
      mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(80);

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      const restoredData = await result.current.restoreFromHistory(0);

      expect(restoredData).toEqual(mockRestoredData);
      expect(result.current.hasSavedData).toBe(true);
      expect(result.current.completionPercentage).toBe(80);
    });
  });

  describe('Save Status Updates', () => {
    it('updates state when save status changes', async () => {
      let statusCallback: (status: SaveStatus) => void;
      mockFormPersistenceService.onSaveStatusChange.mockImplementation((callback) => {
        statusCallback = callback;
        return () => {};
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      act(() => {
        statusCallback!(SaveStatus.SAVING);
      });

      expect(result.current.saveStatus).toBe(SaveStatus.SAVING);

      act(() => {
        statusCallback!(SaveStatus.SAVED);
      });

      expect(result.current.saveStatus).toBe(SaveStatus.SAVED);
    });

    it('updates metadata after successful save', async () => {
      mockFormPersistenceService.saveFormData.mockResolvedValue();
      mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(90);
      mockFormPersistenceService.getMetadata.mockResolvedValue({
        lastSaved: '2023-01-01T00:00:00.000Z',
        currentStep: 1,
        version: '1.0.0',
        saveCount: 3,
        isComplete: false,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.hasSavedData).toBe(true);
      expect(result.current.completionPercentage).toBe(90);
      expect(result.current.saveCount).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('handles save errors gracefully', async () => {
      const saveError = new Error('Save failed');
      mockFormPersistenceService.saveFormData.mockRejectedValue(saveError);

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      await expect(result.current.saveNow()).rejects.toThrow('Save failed');
    });

    it('handles load errors gracefully', async () => {
      mockFormPersistenceService.loadFormData.mockRejectedValue(new Error('Load failed'));

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      const loadedData = await result.current.loadSavedData();

      expect(loadedData).toBeNull();
    });

    it('handles clear errors gracefully', async () => {
      mockFormPersistenceService.clearFormData.mockRejectedValue(new Error('Clear failed'));

      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      await expect(result.current.clearSavedData()).rejects.toThrow('Clear failed');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles empty form data gracefully', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ formData }) => useFormAutoSave(formData, 1, false),
        { initialProps: { formData: emptyFormData } }
      );

      await waitForNextUpdate();

      rerender({ formData: emptyFormData });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not save empty data
      expect(mockFormPersistenceService.saveFormData).not.toHaveBeenCalled();
    });

    it('handles rapid step changes', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ currentStep }) => useFormAutoSave(sampleFormData, currentStep, false, { saveOnStepChange: true }),
        { initialProps: { currentStep: 1 } }
      );

      await waitForNextUpdate();

      // Rapid step changes
      rerender({ currentStep: 2 });
      rerender({ currentStep: 3 });
      rerender({ currentStep: 4 });

      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(3);
    });

    it('cleans up timers on unmount', async () => {
      const { unmount, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('handles concurrent save operations', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useFormAutoSave(sampleFormData, 1, false)
      );

      await waitForNextUpdate();

      // Start multiple saves concurrently
      const promises = [
        result.current.saveNow(),
        result.current.saveNow(),
        result.current.saveNow(),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // All should complete without error
      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom Options', () => {
    it('respects custom debounce time', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ formData }) => useFormAutoSave(formData, 1, false, { debounceMs: 2000 }),
        { initialProps: { formData: sampleFormData } }
      );

      await waitForNextUpdate();

      rerender({ formData: { ...sampleFormData, name: 'Changed' } });

      // Should not save before custom debounce time
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockFormPersistenceService.saveFormData).not.toHaveBeenCalled();

      // Should save after custom debounce time
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalled();
    });

    it('handles form completion state', async () => {
      const { rerender, waitForNextUpdate } = renderHook(
        ({ isComplete }) => useFormAutoSave(sampleFormData, 1, isComplete),
        { initialProps: { isComplete: false } }
      );

      await waitForNextUpdate();

      rerender({ isComplete: true });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
        sampleFormData,
        1,
        true
      );
    });
  });
});
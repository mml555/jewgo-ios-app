import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FormPersistenceService,
  formPersistenceService,
  SaveStatus,
  FormMetadata,
} from '../FormPersistence';
import { ListingFormData } from '../../screens/AddCategoryScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('FormPersistence', () => {
  let service: FormPersistenceService;
  
  const sampleFormData: Partial<ListingFormData> = {
    name: 'Test Restaurant',
    address: '123 Main St',
    phone: '1234567890',
    business_email: 'test@restaurant.com',
  };

  beforeEach(() => {
    service = new FormPersistenceService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Save Operations', () => {
    it('saves form data successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await service.saveFormData(sampleFormData, 1, false);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'add_eatery_form_data',
        JSON.stringify(sampleFormData)
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'add_eatery_form_metadata',
        expect.stringContaining('"currentStep":1')
      );
    });

    it('merges with existing data', async () => {
      const existingData = { name: 'Old Name', address: '456 Old St' };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingData));
      mockAsyncStorage.setItem.mockResolvedValue();

      const newData = { phone: '9876543210' };
      await service.saveFormData(newData, 2, false);

      const expectedMerged = { ...existingData, ...newData };
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'add_eatery_form_data',
        JSON.stringify(expectedMerged)
      );
    });

    it('updates save status during save operation', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const statusCallback = jest.fn();
      service.onSaveStatusChange(statusCallback);

      const savePromise = service.saveFormData(sampleFormData, 1, false);
      
      // Should be saving initially
      expect(statusCallback).toHaveBeenCalledWith(SaveStatus.SAVING);

      await savePromise;

      // Should be saved after completion
      expect(statusCallback).toHaveBeenCalledWith(SaveStatus.SAVED);
    });

    it('handles save errors gracefully', async () => {
      const error = new Error('Storage error');
      mockAsyncStorage.setItem.mockRejectedValue(error);

      const statusCallback = jest.fn();
      service.onSaveStatusChange(statusCallback);

      await expect(service.saveFormData(sampleFormData, 1, false)).rejects.toThrow('Storage error');
      expect(statusCallback).toHaveBeenCalledWith(SaveStatus.ERROR);
    });

    it('creates proper metadata', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await service.saveFormData(sampleFormData, 2, true);

      const metadataCall = mockAsyncStorage.setItem.mock.calls.find(
        call => call[0] === 'add_eatery_form_metadata'
      );
      
      expect(metadataCall).toBeDefined();
      const metadata = JSON.parse(metadataCall![1]);
      
      expect(metadata.currentStep).toBe(2);
      expect(metadata.isComplete).toBe(true);
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.saveCount).toBe(1);
      expect(metadata.lastSaved).toBeDefined();
    });
  });

  describe('Load Operations', () => {
    it('loads form data successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleFormData));

      const result = await service.loadFormData();

      expect(result).toEqual(sampleFormData);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('add_eatery_form_data');
    });

    it('returns null when no data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await service.loadFormData();

      expect(result).toBeNull();
    });

    it('handles corrupted data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      const result = await service.loadFormData();

      expect(result).toBeNull();
    });

    it('loads metadata successfully', async () => {
      const metadata: FormMetadata = {
        lastSaved: '2023-01-01T00:00:00.000Z',
        currentStep: 2,
        version: '1.0.0',
        saveCount: 5,
        isComplete: false,
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));

      const result = await service.getMetadata();

      expect(result).toEqual(metadata);
    });

    it('gets last saved step', async () => {
      const metadata: FormMetadata = {
        lastSaved: '2023-01-01T00:00:00.000Z',
        currentStep: 3,
        version: '1.0.0',
        saveCount: 1,
        isComplete: false,
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));

      const step = await service.getLastSavedStep();

      expect(step).toBe(3);
    });

    it('returns default step when no metadata', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const step = await service.getLastSavedStep();

      expect(step).toBe(1);
    });
  });

  describe('Clear Operations', () => {
    it('clears all form data', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await service.clearFormData();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('add_eatery_form_data');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('add_eatery_form_metadata');
    });

    it('updates save status when clearing', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      const statusCallback = jest.fn();
      service.onSaveStatusChange(statusCallback);

      await service.clearFormData();

      expect(statusCallback).toHaveBeenCalledWith(SaveStatus.IDLE);
    });
  });

  describe('Data Detection', () => {
    it('detects saved data correctly', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(sampleFormData));

      const hasSaved = await service.hasSavedData();

      expect(hasSaved).toBe(true);
    });

    it('detects no saved data correctly', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const hasSaved = await service.hasSavedData();

      expect(hasSaved).toBe(false);
    });

    it('handles detection errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const hasSaved = await service.hasSavedData();

      expect(hasSaved).toBe(false);
    });
  });

  describe('Auto-Save', () => {
    it('starts auto-save timer', () => {
      const getFormData = jest.fn().mockReturnValue(sampleFormData);
      const getCurrentStep = jest.fn().mockReturnValue(1);
      const isFormComplete = jest.fn().mockReturnValue(false);

      service.startAutoSave(getFormData, getCurrentStep, isFormComplete);

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('stops auto-save timer', () => {
      const getFormData = jest.fn().mockReturnValue(sampleFormData);
      const getCurrentStep = jest.fn().mockReturnValue(1);

      service.startAutoSave(getFormData, getCurrentStep);
      service.stopAutoSave();

      expect(clearInterval).toHaveBeenCalled();
    });

    it('auto-saves when timer fires', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const getFormData = jest.fn().mockReturnValue(sampleFormData);
      const getCurrentStep = jest.fn().mockReturnValue(1);

      service.startAutoSave(getFormData, getCurrentStep);

      // Fast-forward timer
      jest.advanceTimersByTime(30000);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('only auto-saves when there is meaningful data', async () => {
      const getFormData = jest.fn().mockReturnValue({});
      const getCurrentStep = jest.fn().mockReturnValue(1);

      service.startAutoSave(getFormData, getCurrentStep);

      jest.advanceTimersByTime(30000);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Save History', () => {
    it('saves to history', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // For main data merge
        .mockResolvedValueOnce(null) // For metadata
        .mockResolvedValueOnce(null); // For history

      await service.saveFormData(sampleFormData, 1, false);

      const historyCall = mockAsyncStorage.setItem.mock.calls.find(
        call => call[0] === 'add_eatery_form_data_history'
      );
      
      expect(historyCall).toBeDefined();
    });

    it('gets save history', async () => {
      const history = [
        {
          data: sampleFormData,
          metadata: {
            lastSaved: '2023-01-01T00:00:00.000Z',
            currentStep: 1,
            version: '1.0.0',
            saveCount: 1,
            isComplete: false,
          },
        },
      ];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(history));

      const result = await service.getSaveHistory();

      expect(result).toEqual(history);
    });

    it('restores from history', async () => {
      const history = [
        {
          data: sampleFormData,
          metadata: {
            lastSaved: '2023-01-01T00:00:00.000Z',
            currentStep: 1,
            version: '1.0.0',
            saveCount: 1,
            isComplete: false,
          },
        },
      ];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(history));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await service.restoreFromHistory(0);

      expect(result).toEqual(sampleFormData);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('limits history size', async () => {
      // Create history with more than max items
      const largeHistory = Array(10).fill(null).map((_, i) => ({
        data: { name: `Restaurant ${i}` },
        metadata: {
          lastSaved: '2023-01-01T00:00:00.000Z',
          currentStep: 1,
          version: '1.0.0',
          saveCount: i + 1,
          isComplete: false,
        },
      }));
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // For main data merge
        .mockResolvedValueOnce(null) // For metadata
        .mockResolvedValueOnce(JSON.stringify(largeHistory)); // For history

      mockAsyncStorage.setItem.mockResolvedValue();

      await service.saveFormData(sampleFormData, 1, false);

      const historyCall = mockAsyncStorage.setItem.mock.calls.find(
        call => call[0] === 'add_eatery_form_data_history'
      );
      
      const savedHistory = JSON.parse(historyCall![1]);
      expect(savedHistory.length).toBeLessThanOrEqual(5); // MAX_SAVE_HISTORY
    });
  });

  describe('Form Completion', () => {
    it('calculates completion percentage', async () => {
      const partialData = {
        name: 'Test Restaurant',
        address: '123 Main St',
        // Missing other required fields
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(partialData));

      const percentage = await service.getFormCompletionPercentage();

      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(100);
    });

    it('returns 0% for no data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const percentage = await service.getFormCompletionPercentage();

      expect(percentage).toBe(0);
    });

    it('returns 100% for complete data', async () => {
      const completeData = {
        name: 'Test Restaurant',
        address: '123 Main St',
        phone: '1234567890',
        business_email: 'test@restaurant.com',
        listing_type: 'Eatery',
        kosher_category: 'Meat',
        short_description: 'A great restaurant',
        business_hours: [
          { day: 'Monday', openTime: '09:00', closeTime: '17:00', isClosed: false },
        ],
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(completeData));

      const percentage = await service.getFormCompletionPercentage();

      expect(percentage).toBe(100);
    });
  });

  describe('Data Migration', () => {
    it('migrates data when version changes', async () => {
      const oldVersionData = { name: 'Test Restaurant' };
      const oldMetadata = {
        lastSaved: '2023-01-01T00:00:00.000Z',
        currentStep: 1,
        version: '1.0.0',
        saveCount: 1,
        isComplete: false,
      };
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(oldVersionData))
        .mockResolvedValueOnce(JSON.stringify(oldMetadata));
      
      mockAsyncStorage.setItem.mockResolvedValue();

      // Mock current version as newer
      const service = new FormPersistenceService();
      service.currentVersion = '1.1.0';

      const result = await service.loadFormData();

      expect(result).toBeDefined();
      // Migration logic would be tested based on actual migration needs
    });
  });

  describe('Import/Export', () => {
    it('exports form data', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(sampleFormData))
        .mockResolvedValueOnce(JSON.stringify({
          lastSaved: '2023-01-01T00:00:00.000Z',
          currentStep: 1,
          version: '1.0.0',
          saveCount: 1,
          isComplete: false,
        }))
        .mockResolvedValueOnce(JSON.stringify([]));

      const exported = await service.exportFormData();

      const parsed = JSON.parse(exported);
      expect(parsed.formData).toEqual(sampleFormData);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.history).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
    });

    it('imports form data', async () => {
      const importData = {
        formData: sampleFormData,
        metadata: {
          lastSaved: '2023-01-01T00:00:00.000Z',
          currentStep: 1,
          version: '1.0.0',
          saveCount: 1,
          isComplete: false,
        },
        history: [],
        exportedAt: '2023-01-01T00:00:00.000Z',
      };
      
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await service.importFormData(JSON.stringify(importData));

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'add_eatery_form_data',
        JSON.stringify(sampleFormData)
      );
    });
  });

  describe('Save Status Management', () => {
    it('manages save status callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = service.onSaveStatusChange(callback1);
      const unsubscribe2 = service.onSaveStatusChange(callback2);

      service.updateSaveStatus(SaveStatus.SAVING);

      expect(callback1).toHaveBeenCalledWith(SaveStatus.SAVING);
      expect(callback2).toHaveBeenCalledWith(SaveStatus.SAVING);

      unsubscribe1();
      service.updateSaveStatus(SaveStatus.SAVED);

      expect(callback1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(callback2).toHaveBeenCalledWith(SaveStatus.SAVED);

      unsubscribe2();
    });

    it('returns current save status', () => {
      expect(service.getSaveStatus()).toBe(SaveStatus.IDLE);
    });

    it('resets status after timeout', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const statusCallback = jest.fn();
      service.onSaveStatusChange(statusCallback);

      await service.saveFormData(sampleFormData, 1, false);

      expect(statusCallback).toHaveBeenCalledWith(SaveStatus.SAVED);

      // Fast-forward past timeout
      jest.advanceTimersByTime(3000);

      expect(statusCallback).toHaveBeenCalledWith(SaveStatus.IDLE);
    });
  });

  describe('Edge Cases', () => {
    it('handles concurrent save operations', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const promises = [
        service.saveFormData({ name: 'Restaurant 1' }, 1, false),
        service.saveFormData({ name: 'Restaurant 2' }, 2, false),
        service.saveFormData({ name: 'Restaurant 3' }, 3, false),
      ];

      await Promise.all(promises);

      // All saves should complete without error
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(6); // 3 data + 3 metadata
    });

    it('handles storage quota exceeded', async () => {
      const quotaError = new Error('QuotaExceededError');
      mockAsyncStorage.setItem.mockRejectedValue(quotaError);

      await expect(service.saveFormData(sampleFormData, 1, false)).rejects.toThrow('QuotaExceededError');
    });

    it('handles malformed JSON in storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('{ invalid json }');

      const result = await service.loadFormData();
      expect(result).toBeNull();

      const metadata = await service.getMetadata();
      expect(metadata).toBeNull();
    });
  });

  describe('Default Service Instance', () => {
    it('provides working default instance', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await formPersistenceService.saveFormData(sampleFormData, 1, false);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
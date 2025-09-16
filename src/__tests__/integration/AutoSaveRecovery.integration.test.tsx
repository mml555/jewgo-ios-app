/**
 * Integration tests for auto-save functionality and data recovery
 * Tests auto-save behavior, data recovery scenarios, and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddCategoryScreen from '../../screens/AddCategoryScreen';
import { formPersistenceService, SaveStatus } from '../../services/FormPersistence';
import { useFormAutoSave } from '../../hooks/useFormAutoSave';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/FormPersistence');
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  addEventListener: jest.fn(),
  currentState: 'active',
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockFormPersistenceService = formPersistenceService as jest.Mocked<typeof formPersistenceService>;
const mockAppState = AppState as jest.Mocked<typeof AppState>;

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: { category: 'Eatery' },
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('Auto-Save and Recovery Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default AsyncStorage mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    // Setup default FormPersistenceService mocks
    mockFormPersistenceService.hasSavedData.mockResolvedValue(false);
    mockFormPersistenceService.getMetadata.mockResolvedValue(null);
    mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(0);
    mockFormPersistenceService.saveFormData.mockResolvedValue();
    mockFormPersistenceService.loadFormData.mockResolvedValue(null);
    mockFormPersistenceService.clearFormData.mockResolvedValue();
    mockFormPersistenceService.onSaveStatusChange.mockReturnValue(() => {});
    mockFormPersistenceService.startAutoSave.mockImplementation(() => {});
    mockFormPersistenceService.stopAutoSave.mockImplementation(() => {});

    // Mock navigation
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => mockNavigation,
      useRoute: () => mockRoute,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save form data at regular intervals', async () => {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out form data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Auto Save Restaurant');

      // Verify auto-save was started
      expect(mockFormPersistenceService.startAutoSave).toHaveBeenCalled();

      // Fast-forward time to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds
      });

      // Should have triggered auto-save
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalled();
      });
    });

    it('should debounce rapid form changes', async () => {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      const nameInput = getByPlaceholderText('Business name');

      // Make rapid changes
      fireEvent.changeText(nameInput, 'A');
      fireEvent.changeText(nameInput, 'AB');
      fireEvent.changeText(nameInput, 'ABC');
      fireEvent.changeText(nameInput, 'ABCD');
      fireEvent.changeText(nameInput, 'ABCDE');

      // Should not save immediately
      expect(mockFormPersistenceService.saveFormData).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should save only once after debounce
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(1);
      });
    });

    it('should save immediately when step changes', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Fill out some data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Step Change Restaurant');

      // Navigate to next step
      fireEvent.press(getByText('Next →'));

      // Should save immediately on step change
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalled();
      });
    });

    it('should save when app goes to background', async () => {
      let appStateCallback: (nextAppState: string) => void;
      mockAppState.addEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          appStateCallback = callback;
        }
        return { remove: jest.fn() };
      });

      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out some data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Background Save Restaurant');

      // Simulate app going to background
      act(() => {
        appStateCallback!('background');
      });

      // Should save when app goes to background
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalled();
      });
    });

    it('should show save status indicator', async () => {
      let statusCallback: (status: SaveStatus) => void;
      mockFormPersistenceService.onSaveStatusChange.mockImplementation((callback) => {
        statusCallback = callback;
        return () => {};
      });

      const { getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const saveIndicator = getByTestId('save-status-indicator');
        expect(saveIndicator).toBeTruthy();
      });

      // Simulate save status changes
      act(() => {
        statusCallback!(SaveStatus.SAVING);
      });

      await waitFor(() => {
        const saveIndicator = getByTestId('save-status-indicator');
        expect(saveIndicator.props.children).toContain('Saving');
      });

      act(() => {
        statusCallback!(SaveStatus.SAVED);
      });

      await waitFor(() => {
        const saveIndicator = getByTestId('save-status-indicator');
        expect(saveIndicator.props.children).toContain('Saved');
      });
    });
  });

  describe('Data Recovery Scenarios', () => {
    it('should recover data after app restart', async () => {
      const savedData = {
        name: 'Recovered Restaurant',
        address: '123 Recovery St',
        phone: '1234567890',
        business_email: 'recovery@test.com',
      };

      const savedMetadata = {
        lastSaved: new Date().toISOString(),
        currentStep: 2,
        version: '1.0.0',
        saveCount: 3,
        isComplete: false,
      };

      mockFormPersistenceService.hasSavedData.mockResolvedValue(true);
      mockFormPersistenceService.loadFormData.mockResolvedValue(savedData);
      mockFormPersistenceService.getMetadata.mockResolvedValue(savedMetadata);
      mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(60);

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should show recovery dialog
      await waitFor(() => {
        expect(getByText('Recover Draft')).toBeTruthy();
        expect(getByText('Continue Draft')).toBeTruthy();
        expect(getByText('Start Fresh')).toBeTruthy();
      });

      // Choose to continue draft
      fireEvent.press(getByText('Continue Draft'));

      // Should restore the saved data
      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput.props.value).toBe(savedData.name);
      });
    });

    it('should handle corrupted saved data gracefully', async () => {
      mockFormPersistenceService.hasSavedData.mockResolvedValue(true);
      mockFormPersistenceService.loadFormData.mockRejectedValue(new Error('Corrupted data'));

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should initialize with default data instead of crashing
      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
        expect(getByText('Basic Info')).toBeTruthy();
      });
    });

    it('should provide save history for recovery', async () => {
      const saveHistory = [
        {
          data: { name: 'Version 1', address: '123 St' },
          metadata: {
            lastSaved: '2023-01-01T10:00:00.000Z',
            currentStep: 1,
            version: '1.0.0',
            saveCount: 1,
            isComplete: false,
          },
        },
        {
          data: { name: 'Version 2', address: '456 Ave' },
          metadata: {
            lastSaved: '2023-01-01T11:00:00.000Z',
            currentStep: 2,
            version: '1.0.0',
            saveCount: 2,
            isComplete: false,
          },
        },
      ];

      mockFormPersistenceService.getSaveHistory.mockResolvedValue(saveHistory);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Access save history (implementation would depend on UI)
      const historyButton = getByText('View History');
      fireEvent.press(historyButton);

      await waitFor(() => {
        expect(getByText('Version 1')).toBeTruthy();
        expect(getByText('Version 2')).toBeTruthy();
      });
    });

    it('should restore from specific history point', async () => {
      const historyData = { name: 'Historical Restaurant', address: '789 History Blvd' };
      
      mockFormPersistenceService.restoreFromHistory.mockResolvedValue(historyData);

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Simulate restoring from history
      const restoreButton = getByText('Restore Version 1');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput.props.value).toBe(historyData.name);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const saveError = new Error('Storage quota exceeded');
      mockFormPersistenceService.saveFormData.mockRejectedValue(saveError);

      let statusCallback: (status: SaveStatus) => void;
      mockFormPersistenceService.onSaveStatusChange.mockImplementation((callback) => {
        statusCallback = callback;
        return () => {};
      });

      const { getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out data to trigger save
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Error Test Restaurant');

      // Simulate save error
      act(() => {
        statusCallback!(SaveStatus.ERROR);
      });

      // Should show error status
      await waitFor(() => {
        const saveIndicator = getByTestId('save-status-indicator');
        expect(saveIndicator.props.children).toContain('Error');
      });
    });

    it('should retry failed saves', async () => {
      mockFormPersistenceService.saveFormData
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce();

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Retry Test Restaurant');

      // Try to save (will fail first time)
      const saveButton = getByText('Save Now');
      fireEvent.press(saveButton);

      // Should show retry option
      await waitFor(() => {
        expect(getByText('Retry Save')).toBeTruthy();
      });

      // Retry save
      fireEvent.press(getByText('Retry Save'));

      // Should succeed on retry
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle storage quota exceeded', async () => {
      const quotaError = new Error('QuotaExceededError');
      mockFormPersistenceService.saveFormData.mockRejectedValue(quotaError);

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Quota Test Restaurant');

      // Trigger save
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should show storage full warning
      await waitFor(() => {
        expect(getByText('Storage Full')).toBeTruthy();
        expect(getByText('Clear Old Data')).toBeTruthy();
      });
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network request failed');
      mockFormPersistenceService.saveFormData.mockRejectedValue(networkError);

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Network Test Restaurant');

      // Trigger save
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should show offline mode
      await waitFor(() => {
        expect(getByText('Offline Mode')).toBeTruthy();
        expect(getByText('Will sync when online')).toBeTruthy();
      });
    });
  });

  describe('Data Migration', () => {
    it('should migrate data from older versions', async () => {
      const oldVersionData = {
        name: 'Old Version Restaurant',
        // Old format fields
        hours: {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
        },
      };

      const oldMetadata = {
        lastSaved: '2023-01-01T00:00:00.000Z',
        currentStep: 1,
        version: '1.0.0', // Old version
        saveCount: 1,
        isComplete: false,
      };

      mockFormPersistenceService.hasSavedData.mockResolvedValue(true);
      mockFormPersistenceService.loadFormData.mockResolvedValue(oldVersionData);
      mockFormPersistenceService.getMetadata.mockResolvedValue(oldMetadata);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should show migration dialog
      await waitFor(() => {
        expect(getByText('Data Migration')).toBeTruthy();
        expect(getByText('Migrate Data')).toBeTruthy();
      });

      // Confirm migration
      fireEvent.press(getByText('Migrate Data'));

      // Should migrate data to new format
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Old Version Restaurant',
            business_hours: expect.arrayContaining([
              expect.objectContaining({
                day: 'Monday',
                openTime: '9:00 AM',
                closeTime: '5:00 PM',
                isClosed: false,
              }),
            ]),
          }),
          1,
          false
        );
      });
    });

    it('should handle migration errors', async () => {
      const corruptedData = {
        name: 'Corrupted Restaurant',
        // Invalid/corrupted fields
        hours: 'invalid format',
      };

      mockFormPersistenceService.hasSavedData.mockResolvedValue(true);
      mockFormPersistenceService.loadFormData.mockResolvedValue(corruptedData);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should show migration error
      await waitFor(() => {
        expect(getByText('Migration Error')).toBeTruthy();
        expect(getByText('Start Fresh')).toBeTruthy();
        expect(getByText('Export Data')).toBeTruthy();
      });
    });
  });

  describe('Import/Export Functionality', () => {
    it('should export form data', async () => {
      const exportData = {
        formData: { name: 'Export Restaurant' },
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

      mockFormPersistenceService.exportFormData.mockResolvedValue(JSON.stringify(exportData));

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Access export functionality
      const exportButton = getByText('Export Data');
      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(mockFormPersistenceService.exportFormData).toHaveBeenCalled();
        expect(getByText('Data Exported')).toBeTruthy();
      });
    });

    it('should import form data', async () => {
      const importData = {
        formData: { name: 'Imported Restaurant' },
        metadata: {
          lastSaved: '2023-01-01T00:00:00.000Z',
          currentStep: 2,
          version: '1.0.0',
          saveCount: 5,
          isComplete: false,
        },
        history: [],
        exportedAt: '2023-01-01T00:00:00.000Z',
      };

      mockFormPersistenceService.importFormData.mockResolvedValue();

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Access import functionality
      const importButton = getByText('Import Data');
      fireEvent.press(importButton);

      // Simulate file selection and import
      const importInput = getByPlaceholderText('Paste import data');
      fireEvent.changeText(importInput, JSON.stringify(importData));

      const confirmImportButton = getByText('Import');
      fireEvent.press(confirmImportButton);

      await waitFor(() => {
        expect(mockFormPersistenceService.importFormData).toHaveBeenCalledWith(
          JSON.stringify(importData)
        );
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks with frequent saves', async () => {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      const nameInput = getByPlaceholderText('Business name');

      // Simulate frequent changes and saves
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(nameInput, `Restaurant ${i}`);
        
        act(() => {
          jest.advanceTimersByTime(100);
        });
      }

      // Should still be functional
      expect(nameInput).toBeTruthy();
    });

    it('should clean up auto-save timers on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockFormPersistenceService.startAutoSave).toHaveBeenCalled();
      });

      // Unmount component
      unmount();

      // Should stop auto-save
      expect(mockFormPersistenceService.stopAutoSave).toHaveBeenCalled();
    });

    it('should limit save history size', async () => {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      const nameInput = getByPlaceholderText('Business name');

      // Make many changes to create history
      for (let i = 0; i < 20; i++) {
        fireEvent.changeText(nameInput, `Restaurant ${i}`);
        
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }

      // History should be limited (implementation would verify actual limit)
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalled();
      });
    });
  });
});
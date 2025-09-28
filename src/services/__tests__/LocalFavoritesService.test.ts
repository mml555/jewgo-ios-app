import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalFavoritesService, LocalFavorite } from '../LocalFavoritesService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('LocalFavoritesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLocalFavorites', () => {
    it('should return empty array when no favorites stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const favorites = await LocalFavoritesService.getLocalFavorites();

      expect(favorites).toEqual([]);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('guest_favorites');
    });

    it('should return parsed favorites when stored', async () => {
      const mockFavorites: LocalFavorite[] = [
        {
          entity_id: 'test-1',
          entity_name: 'Test Restaurant',
          entity_type: 'restaurant',
          favorited_at: '2024-01-01T00:00:00Z',
          category: 'restaurant',
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockFavorites));

      const favorites = await LocalFavoritesService.getLocalFavorites();

      expect(favorites).toEqual(mockFavorites);
    });
  });

  describe('addLocalFavorite', () => {
    it('should add new favorite to storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue();

      const entityData = {
        entity_id: 'test-1',
        entity_name: 'Test Restaurant',
        entity_type: 'restaurant',
      };

      const result = await LocalFavoritesService.addLocalFavorite(entityData);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'guest_favorites',
        expect.stringContaining('"entity_id":"test-1"')
      );
    });

    it('should not add duplicate favorites', async () => {
      const existingFavorites = [
        {
          entity_id: 'test-1',
          entity_name: 'Test Restaurant',
          entity_type: 'restaurant',
          favorited_at: '2024-01-01T00:00:00Z',
          category: 'restaurant',
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFavorites));

      const entityData = {
        entity_id: 'test-1',
        entity_name: 'Test Restaurant',
        entity_type: 'restaurant',
      };

      const result = await LocalFavoritesService.addLocalFavorite(entityData);

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeLocalFavorite', () => {
    it('should remove favorite from storage', async () => {
      const existingFavorites = [
        {
          entity_id: 'test-1',
          entity_name: 'Test Restaurant',
          entity_type: 'restaurant',
          favorited_at: '2024-01-01T00:00:00Z',
          category: 'restaurant',
        },
        {
          entity_id: 'test-2',
          entity_name: 'Test Synagogue',
          entity_type: 'synagogue',
          favorited_at: '2024-01-01T00:00:00Z',
          category: 'synagogue',
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFavorites));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await LocalFavoritesService.removeLocalFavorite('test-1');

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'guest_favorites',
        expect.not.stringContaining('"entity_id":"test-1"')
      );
    });
  });

  describe('isLocalFavorite', () => {
    it('should return true if entity is favorited', async () => {
      const existingFavorites = [
        {
          entity_id: 'test-1',
          entity_name: 'Test Restaurant',
          entity_type: 'restaurant',
          favorited_at: '2024-01-01T00:00:00Z',
          category: 'restaurant',
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFavorites));

      const result = await LocalFavoritesService.isLocalFavorite('test-1');

      expect(result).toBe(true);
    });

    it('should return false if entity is not favorited', async () => {
      const existingFavorites = [
        {
          entity_id: 'test-1',
          entity_name: 'Test Restaurant',
          entity_type: 'restaurant',
          favorited_at: '2024-01-01T00:00:00Z',
          category: 'restaurant',
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFavorites));

      const result = await LocalFavoritesService.isLocalFavorite('test-2');

      expect(result).toBe(false);
    });
  });

  describe('clearLocalFavorites', () => {
    it('should remove favorites from storage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await LocalFavoritesService.clearLocalFavorites();

      expect(result).toBe(true);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('guest_favorites');
    });
  });
});

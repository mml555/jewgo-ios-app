import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorLog } from '../utils/logger';
// Using emoji icons instead of vector icons to avoid dependencies

// Types for database entities
interface DatabaseEntity {
  id: string;
  entity_type: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_active: boolean;
  kosher_level?: string;
  denomination?: string;
  store_type?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseStats {
  total_entities: number;
  restaurants: number;
  synagogues: number;
  mikvahs: number;
  stores: number;
  verified_count: number;
  active_count: number;
  total_reviews: number;
  average_rating: number;
}

interface DatabaseConnection {
  status: 'connected' | 'disconnected' | 'error';
  message: string;
  response_time?: number;
}

const DatabaseDashboard: React.FC = () => {
  const [entities, setEntities] = useState<DatabaseEntity[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [connection, setConnection] = useState<DatabaseConnection>({
    status: 'disconnected',
    message: 'Not connected',
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<DatabaseEntity | null>(
    null,
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Test database connection
  const testConnection = useCallback(async () => {
    try {
      setLoading(true);
      const startTime = Date.now();

      const response = await fetch('http://127.0.0.1:3001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        setConnection({
          status: 'connected',
          message: 'Database connection successful',
          response_time: responseTime,
        });
        return true;
      } else {
        setConnection({
          status: 'error',
          message: `Connection failed: ${response.status}`,
          response_time: responseTime,
        });
        return false;
      }
    } catch (error) {
      setConnection({
        status: 'error',
        message: `Connection error: ${
          (error as Error).message || String(error)
        }`,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch database statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:3001/api/v5/dashboard/entities/stats',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      errorLog('Error fetching stats:', error);
    }
  }, []);

  // Fetch all entities
  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'http://127.0.0.1:3001/api/v5/dashboard/entities/recent?limit=100',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setEntities(data.data || []);
      } else {
        Alert.alert('Error', 'Failed to fetch entities');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to fetch entities: ${
          (error as Error).message || String(error)
        }`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Update entity
  const updateEntity = useCallback(
    async (entityId: string, updates: Partial<DatabaseEntity>) => {
      try {
        const response = await fetch(
          `http://127.0.0.1:3001/api/v5/entities/${entityId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          },
        );

        if (response.ok) {
          Alert.alert('Success', 'Entity updated successfully');
          fetchEntities(); // Refresh the list
          setEditModalVisible(false);
          setSelectedEntity(null);
        } else {
          Alert.alert('Error', 'Failed to update entity');
        }
      } catch (error) {
        Alert.alert(
          'Error',
          `Failed to update entity: ${
            (error as Error).message || String(error)
          }`,
        );
      }
    },
    [fetchEntities],
  );

  // Delete entity
  const deleteEntity = useCallback(
    async (entityId: string) => {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this entity? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(
                  `http://127.0.0.1:3001/api/v5/entities/${entityId}`,
                  {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  },
                );

                if (response.ok) {
                  Alert.alert('Success', 'Entity deleted successfully');
                  fetchEntities(); // Refresh the list
                } else {
                  Alert.alert('Error', 'Failed to delete entity');
                }
              } catch (error) {
                Alert.alert(
                  'Error',
                  `Failed to delete entity: ${
                    (error as Error).message || String(error)
                  }`,
                );
              }
            },
          },
        ],
      );
    },
    [fetchEntities],
  );

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      const connected = await testConnection();
      if (connected) {
        await Promise.all([fetchStats(), fetchEntities()]);
      }
    };

    initializeDashboard();
  }, [testConnection, fetchStats, fetchEntities]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([testConnection(), fetchStats(), fetchEntities()]);
    setRefreshing(false);
  }, [testConnection, fetchStats, fetchEntities]);

  // Filter entities
  const filteredEntities = entities.filter(entity => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' || entity.entity_type === filterType;
    return matchesSearch && matchesType;
  });

  const getConnectionStatusColor = () => {
    switch (connection.status) {
      case 'connected':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant':
        return '#FF5722';
      case 'synagogue':
        return '#2196F3';
      case 'mikvah':
        return '#9C27B0';
      case 'store':
        return '#4CAF50';
      default:
        return '#607D8B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Database Dashboard</Text>
          <TouchableOpacity
            style={[
              styles.connectionButton,
              { backgroundColor: getConnectionStatusColor() },
            ]}
            onPress={testConnection}
          >
            <Text style={styles.connectionIcon}>📶</Text>
            <Text style={styles.connectionText}>
              {connection.status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Database Status</Text>
          <Text style={styles.statusMessage}>{connection.message}</Text>
          {connection.response_time && (
            <Text style={styles.responseTime}>
              Response Time: {connection.response_time}ms
            </Text>
          )}
        </View>

        {/* Statistics */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Database Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.total_entities}</Text>
                <Text style={styles.statLabel}>Total Entities</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.restaurants}</Text>
                <Text style={styles.statLabel}>Restaurants</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.synagogues}</Text>
                <Text style={styles.statLabel}>Synagogues</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.mikvahs}</Text>
                <Text style={styles.statLabel}>Mikvahs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.stores}</Text>
                <Text style={styles.statLabel}>Stores</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.verified_count}</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
            </View>
          </View>
        )}

        {/* Search and Filter */}
        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search entities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterButtons}>
            {['all', 'restaurant', 'synagogue', 'mikvah', 'store'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  filterType === type && styles.filterButtonActive,
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterType === type && styles.filterButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Entities List */}
        <View style={styles.entitiesCard}>
          <Text style={styles.entitiesTitle}>
            Entities ({filteredEntities.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#2196F3" />
          ) : (
            filteredEntities.map(entity => (
              <TouchableOpacity
                key={entity.id}
                style={styles.entityItem}
                onPress={() => {
                  setSelectedEntity(entity);
                  setEditModalVisible(true);
                }}
              >
                <View style={styles.entityHeader}>
                  <View style={styles.entityInfo}>
                    <Text style={styles.entityName}>{entity.name}</Text>
                    <Text style={styles.entityType}>
                      {entity.entity_type.charAt(0).toUpperCase() +
                        entity.entity_type.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.entityBadges}>
                    {entity.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedIcon}>✓</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: getEntityTypeColor(
                            entity.entity_type,
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {entity.entity_type.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.entityAddress}>
                  {entity.address}, {entity.city}, {entity.state}{' '}
                  {entity.zip_code}
                </Text>

                <View style={styles.entityFooter}>
                  <Text style={styles.entityRating}>
                    ⭐ {entity.rating.toFixed(1)} ({entity.review_count}{' '}
                    reviews)
                  </Text>
                  <View style={styles.entityActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteEntity(entity.id)}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Entity</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setEditModalVisible(false);
                setSelectedEntity(null);
              }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedEntity && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={selectedEntity.name}
                  onChangeText={text =>
                    setSelectedEntity({ ...selectedEntity, name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={selectedEntity.description}
                  onChangeText={text =>
                    setSelectedEntity({ ...selectedEntity, description: text })
                  }
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={styles.formInput}
                  value={selectedEntity.address}
                  onChangeText={text =>
                    setSelectedEntity({ ...selectedEntity, address: text })
                  }
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedEntity.city}
                    onChangeText={text =>
                      setSelectedEntity({ ...selectedEntity, city: text })
                    }
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>State</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedEntity.state}
                    onChangeText={text =>
                      setSelectedEntity({ ...selectedEntity, state: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  style={styles.formInput}
                  value={selectedEntity.phone}
                  onChangeText={text =>
                    setSelectedEntity({ ...selectedEntity, phone: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={selectedEntity.email}
                  onChangeText={text =>
                    setSelectedEntity({ ...selectedEntity, email: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Website</Text>
                <TextInput
                  style={styles.formInput}
                  value={selectedEntity.website}
                  onChangeText={text =>
                    setSelectedEntity({ ...selectedEntity, website: text })
                  }
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.switchGroup}>
                  <Text style={styles.formLabel}>Verified</Text>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      selectedEntity.is_verified && styles.checkboxChecked,
                    ]}
                    onPress={() =>
                      setSelectedEntity({
                        ...selectedEntity,
                        is_verified: !selectedEntity.is_verified,
                      })
                    }
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selectedEntity.is_verified }}
                    accessibilityLabel="Toggle verified status"
                  >
                    {selectedEntity.is_verified && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.switchGroup}>
                  <Text style={styles.formLabel}>Active</Text>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      selectedEntity.is_active && styles.checkboxChecked,
                    ]}
                    onPress={() =>
                      setSelectedEntity({
                        ...selectedEntity,
                        is_active: !selectedEntity.is_active,
                      })
                    }
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selectedEntity.is_active }}
                    accessibilityLabel="Toggle active status"
                  >
                    {selectedEntity.is_active && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => updateEntity(selectedEntity.id, selectedEntity)}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  connectionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
  },
  responseTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  searchCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  entitiesCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  entityItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  entityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  entityType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  entityBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 4,
    marginRight: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  entityAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  entityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entityRating: {
    fontSize: 12,
    color: '#666',
  },
  entityActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupHalf: {
    width: '48%',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Checkbox styles
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DatabaseDashboard;

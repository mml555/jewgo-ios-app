import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import ClaimsService, {
  Claim,
  ClaimEvidence,
} from '../../services/ClaimsService';
import { Spacing, Typography } from '../../styles/designSystem';

type RouteParams = {
  ClaimDetail: {
    claimId: string;
  };
};

const ClaimDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ClaimDetail'>>();
  const insets = useSafeAreaInsets();
  const { claimId } = route.params;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [evidence, setEvidence] = useState<ClaimEvidence[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaimDetails();
  }, [claimId]);

  const loadClaimDetails = async () => {
    try {
      setLoading(true);
      const response = await ClaimsService.getClaimDetails(claimId);
      setClaim(response.claim);
      setEvidence(response.evidence);
      setHistory(response.history);
    } catch (error) {
      Alert.alert('Error', 'Failed to load claim details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      under_review: '#2196F3',
      approved: '#4CAF50',
      rejected: '#F44336',
      cancelled: '#999',
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#74E1A0" />
      </View>
    );
  }

  if (!claim) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{claim.entity_name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(claim.status) },
          ]}
        >
          <Text style={styles.statusText}>{claim.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Claim Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Claimant:</Text>
          <Text style={styles.infoValue}>{claim.claimant_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{claim.claimant_email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{claim.claimant_phone}</Text>
        </View>
        {claim.claimant_role && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{claim.claimant_role}</Text>
          </View>
        )}
      </View>

      {evidence.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence ({evidence.length})</Text>
          {evidence.map(item => (
            <View key={item.id} style={styles.evidenceItem}>
              <Text style={styles.evidenceIcon}>📄</Text>
              <View style={styles.evidenceInfo}>
                <Text style={styles.evidenceName}>{item.file_name}</Text>
                <Text style={styles.evidenceType}>{item.evidence_type}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {claim.admin_notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Notes</Text>
          <Text style={styles.sectionText}>{claim.admin_notes}</Text>
        </View>
      )}

      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {history.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyAction}>{item.action}</Text>
                <Text style={styles.historyDate}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
                {item.notes && (
                  <Text style={styles.historyNotes}>{item.notes}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  section: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily,
  },
  sectionText: { fontSize: 16, color: '#666', lineHeight: 24 },
  infoRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#666', width: 80 },
  infoValue: { flex: 1, fontSize: 14, color: '#292B2D' },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  evidenceIcon: { fontSize: 24, marginRight: Spacing.md },
  evidenceInfo: { flex: 1 },
  evidenceName: { fontSize: 14, fontWeight: '600', color: '#292B2D' },
  evidenceType: { fontSize: 12, color: '#666', marginTop: 2 },
  historyItem: { flexDirection: 'row', marginBottom: Spacing.md },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#74E1A0',
    marginRight: Spacing.md,
    marginTop: 4,
  },
  historyContent: { flex: 1 },
  historyAction: { fontSize: 14, fontWeight: '600', color: '#292B2D' },
  historyDate: { fontSize: 12, color: '#999', marginTop: 2 },
  historyNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ClaimDetailScreen;

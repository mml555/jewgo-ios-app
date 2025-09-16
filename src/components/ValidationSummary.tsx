import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/designSystem';

interface ValidationSummaryProps {
  totalErrors: number;
  totalWarnings: number;
  completedSteps: number;
  totalSteps: number;
  nextRequiredField?: string;
  readyToSubmit: boolean;
  errors?: string[];
  warnings?: string[];
  onFieldPress?: (fieldName: string) => void;
  onDismiss?: () => void;
  compact?: boolean;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  totalErrors,
  totalWarnings,
  completedSteps,
  totalSteps,
  nextRequiredField,
  readyToSubmit,
  errors = [],
  warnings = [],
  onFieldPress,
  onDismiss,
  compact = false,
}) => {
  // Don't show if no validation issues and form is ready
  if (totalErrors === 0 && totalWarnings === 0 && readyToSubmit && compact) {
    return null;
  }

  const getStatusColor = () => {
    if (totalErrors > 0) return Colors.error;
    if (totalWarnings > 0) return Colors.warning;
    if (readyToSubmit) return Colors.success;
    return Colors.primary;
  };

  const getStatusIcon = () => {
    if (totalErrors > 0) return '❌';
    if (totalWarnings > 0) return '⚠️';
    if (readyToSubmit) return '✅';
    return '📝';
  };

  const getStatusText = () => {
    if (totalErrors > 0) {
      return `${totalErrors} error${totalErrors !== 1 ? 's' : ''} to fix`;
    }
    if (totalWarnings > 0) {
      return `${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`;
    }
    if (readyToSubmit) {
      return 'Ready to submit!';
    }
    return `${completedSteps}/${totalSteps} steps completed`;
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();
  const statusText = getStatusText();

  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderColor: statusColor }]}>
        <Text style={styles.compactIcon}>{statusIcon}</Text>
        <Text style={[styles.compactText, { color: statusColor }]}>
          {statusText}
        </Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: statusColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <Text style={styles.statusIcon}>{statusIcon}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(completedSteps / totalSteps) * 100}%`,
                backgroundColor: statusColor,
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((completedSteps / totalSteps) * 100)}% complete
        </Text>
      </View>

      {/* Errors Section */}
      {errors.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>
            Errors to Fix:
          </Text>
          <ScrollView style={styles.issuesList} showsVerticalScrollIndicator={false}>
            {errors.map((error, index) => (
              <View key={index} style={styles.issueItem}>
                <Text style={styles.issueIcon}>❌</Text>
                <Text style={[styles.issueText, { color: Colors.error }]}>
                  {error}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.warning }]}>
            Warnings:
          </Text>
          <ScrollView style={styles.issuesList} showsVerticalScrollIndicator={false}>
            {warnings.map((warning, index) => (
              <View key={index} style={styles.issueItem}>
                <Text style={styles.issueIcon}>⚠️</Text>
                <Text style={[styles.issueText, { color: Colors.warning }]}>
                  {warning}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Next Action */}
      {nextRequiredField && onFieldPress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Step:</Text>
          <TouchableOpacity
            style={styles.nextActionButton}
            onPress={() => onFieldPress(nextRequiredField)}
            activeOpacity={0.7}
          >
            <Text style={styles.nextActionText}>
              Complete {nextRequiredField.replace('_', ' ')} →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Message */}
      {readyToSubmit && totalErrors === 0 && (
        <View style={styles.successSection}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successText}>
            Great! Your form is complete and ready to submit.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusText: {
    ...Typography.styles.body,
    fontWeight: '600',
    fontSize: 16,
  },
  compactIcon: {
    fontSize: 16,
  },
  compactText: {
    ...Typography.styles.body,
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.styles.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  issuesList: {
    maxHeight: 120,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  issueIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  issueText: {
    ...Typography.styles.body,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  nextActionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  nextActionText: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  successSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  successIcon: {
    fontSize: 24,
  },
  successText: {
    ...Typography.styles.body,
    color: Colors.success,
    fontWeight: '600',
    flex: 1,
    fontSize: 14,
  },
});

export default ValidationSummary;
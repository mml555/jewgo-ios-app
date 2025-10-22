import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Colors,
} from '../styles/designSystem';

interface EnhancedProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
  onStepPress?: (stepNumber: number) => void;
  onBackPress?: () => void;
}

const EnhancedProgressIndicator: React.FC<EnhancedProgressIndicatorProps> = memo(
  ({ currentStep, totalSteps, progress, onStepPress, onBackPress }) => {
    const stepDetails = [
      { icon: '📝', title: 'Basic Info', description: 'Name & Details' },
      { icon: '📍', title: 'Location', description: 'Address & Map' },
      { icon: '✅', title: 'Review', description: 'Confirm & Submit' }
    ];

    const handleStepPress = (stepNumber: number) => {
      onStepPress?.(stepNumber);
    };

    return (
      <View style={styles.container}>
        {/* Top Line with Back Button and Progress Text */}
        <View style={styles.topLine}>
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigate to previous step or exit form"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.progressLabel}>Overall Progress: {progress}%</Text>
          <View style={styles.topLineSpacer} />
        </View>
        
        {/* Step Cards */}
        <View style={styles.stepsContainer}>
          {stepDetails.map((step, index) => {
            const stepNumber = index + 1;
            const isCurrent = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            const isNext = stepNumber === currentStep + 1;
            
            return (
              <React.Fragment key={stepNumber}>
                <TouchableOpacity
                  style={[
                    styles.stepCard,
                    isCurrent && styles.stepCardCurrent,
                    isNext && styles.stepCardNext,
                  ]}
                  onPress={() => handleStepPress(stepNumber)}
                  disabled={!isCurrent && !isCompleted}
                >
                  <Text style={[
                    styles.stepIcon,
                    isCurrent && styles.stepIconCurrent,
                    isNext && styles.stepIconNext,
                  ]}>
                    {step.icon}
                  </Text>
                  <Text style={[
                    styles.stepTitle,
                    isCurrent && styles.stepTitleCurrent,
                    isNext && styles.stepTitleNext,
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={[
                    styles.stepDescription,
                    isCurrent && styles.stepDescriptionCurrent,
                    isNext && styles.stepDescriptionNext,
                  ]}>
                    {step.description}
                  </Text>
                </TouchableOpacity>

                {/* Connector Line */}
                {index < stepDetails.length - 1 && (
                  <View style={styles.connector} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 60, // Space below iOS dynamic island
    paddingBottom: 12,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  progressLabel: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.jetBlack,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
  },
  topLineSpacer: {
    width: 40,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  stepCardCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C6FFD1',
  },
  stepCardNext: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFB3B3',
  },
  stepIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  stepIconCurrent: {
    fontSize: 24,
  },
  stepIconNext: {
    fontSize: 24,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#292B2D',
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
    marginBottom: 2,
  },
  stepTitleCurrent: {
    color: '#292B2D',
  },
  stepTitleNext: {
    color: '#292B2D',
  },
  stepDescription: {
    fontSize: 10,
    color: '#6B6B6B',
    fontFamily: 'Nunito',
    textAlign: 'center',
  },
  stepDescriptionCurrent: {
    color: '#6B6B6B',
  },
  stepDescriptionNext: {
    color: '#6B6B6B',
  },
  connector: {
    width: 16,
    height: 2,
    backgroundColor: '#E5E5EA',
    borderRadius: 1,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C6FFD1',
    borderRadius: 4,
  },
});

EnhancedProgressIndicator.displayName = 'EnhancedProgressIndicator';

export default EnhancedProgressIndicator;
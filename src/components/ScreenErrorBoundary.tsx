import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { errorLog } from '../utils/logger';
import CrashReportingService from '../services/CrashReporting';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../styles/designSystem';

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ScreenErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Screen-Level Error Boundary Component
 *
 * Lighter-weight error boundary for individual screens.
 * Provides navigation fallback instead of full app error.
 */
class ScreenErrorBoundary extends Component<
  ScreenErrorBoundaryProps,
  ScreenErrorBoundaryState
> {
  constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<ScreenErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { screenName } = this.props;

    // Log error
    errorLog(
      `ScreenErrorBoundary (${screenName || 'Unknown'}) caught an error:`,
      error,
    );

    // Log to crash reporting
    try {
      const instance = CrashReportingService.getInstance();
      instance.reportError(error, 'javascript_error', 'high', {
        componentStack: errorInfo.componentStack,
        type: 'screen_error_boundary',
        screen: screenName || 'unknown',
      });
    } catch (reportError) {
      errorLog('Failed to report error to crash service:', reportError);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Screen Error</Text>
          <Text style={styles.message}>
            This screen encountered an error and couldn't load properly.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error.toString()}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            {this.props.screenName
              ? `Screen: ${this.props.screenName}`
              : 'Try going back'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background.primary,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  errorBox: {
    backgroundColor: Colors.errorLight || '#FFEBEE',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    maxWidth: '90%',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: Typography.fontFamily,
  },
  button: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.white,
  },
  hint: {
    fontSize: 12,
    color: Colors.text?.secondary || Colors.gray700,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default ScreenErrorBoundary;

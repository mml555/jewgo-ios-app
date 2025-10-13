import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { errorLog } from '../utils/logger';
import crashReportingService from '../services/CrashReporting';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/designSystem';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the component tree,
 * logs the errors, and displays a fallback UI.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    errorLog('ErrorBoundary caught an error:', error);
    errorLog('Error Info:', errorInfo);

    // Log to crash reporting service
    try {
      const instance = crashReportingService.getInstance();
      instance.logError(error, {
        componentStack: errorInfo.componentStack,
        type: 'react_error_boundary',
      });
    } catch (reportError) {
      errorLog('Failed to report error to crash service:', reportError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary if resetOnPropsChange value changes
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange !== undefined &&
      this.props.resetOnPropsChange !== prevProps.resetOnPropsChange
    ) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              If the problem persists, please restart the app.
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: Colors.errorLight || '#FFEBEE',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    width: '100%',
    maxHeight: 300,
  },
  errorTitle: {
    ...Typography.h4,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: 'Courier',
    marginBottom: Spacing.sm,
  },
  errorStack: {
    fontSize: 10,
    color: Colors.text?.secondary || Colors.gray700,
    fontFamily: 'Courier',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
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

export default ErrorBoundary;


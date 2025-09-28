import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock the Google Sign-In library
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSigninButton: ({ onPress, disabled, children, ...props }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text, View } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { onPress, disabled, testID: 'google-signin-button', ...props },
      children || React.createElement(Text, {}, 'Continue with Google')
    );
  },
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn(),
    getCurrentUser: jest.fn(),
    revokeAccess: jest.fn(),
    hasPlayServices: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// Mock the Google Sign-In service
jest.mock('../../../services/GoogleOAuthService', () => ({
  googleOAuthService: {
    isGoogleSignInConfigured: jest.fn(() => true),
    signIn: jest.fn(),
  },
}));

// Mock the auth service
jest.mock('../../../services/AuthService', () => ({
  authService: {
    googleOAuth: jest.fn(),
  },
}));

// Mock device info
jest.mock('react-native-device-info', () => ({
  getSystemName: jest.fn(() => 'iOS'),
  getModel: jest.fn(() => 'iPhone 15'),
  getSystemVersion: jest.fn(() => '17.0'),
  getVersion: jest.fn(() => '1.0.0'),
  getUniqueId: jest.fn(() => Promise.resolve('device-id')),
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

import GoogleSignInButton from '../GoogleSignInButton';

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<GoogleSignInButton />);
    expect(getByText('Continue with Google')).toBeTruthy();
  });

  it('calls onSuccess when Google sign-in is successful', async () => {
    const mockOnSuccess = jest.fn();
    const mockGoogleUser = {
      user: { id: '123', name: 'Test User', email: 'test@example.com', photo: '' },
      idToken: 'mock-token',
      serverAuthCode: 'mock-code',
    };

    const { googleOAuthService } = require('../../../services/GoogleOAuthService');
    const { authService } = require('../../../services/AuthService');

    googleOAuthService.signIn.mockResolvedValue(mockGoogleUser);
    authService.googleOAuth.mockResolvedValue({
      user: { id: '123', email: 'test@example.com' },
      tokens: { accessToken: 'token' },
    });

    const { getByText } = render(
      <GoogleSignInButton onSuccess={mockOnSuccess} />
    );

    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        id: '123',
        email: 'test@example.com',
      });
    });
  });

  it('calls onError when Google sign-in fails', async () => {
    const mockOnError = jest.fn();
    const mockError = new Error('Google sign-in failed');

    const { googleOAuthService } = require('../../../services/GoogleOAuthService');
    googleOAuthService.signIn.mockRejectedValue(mockError);

    const { getByText } = render(
      <GoogleSignInButton onError={mockOnError} />
    );

    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Google Sign-In failed. Please try again.');
    });
  });

  it('shows loading state during sign-in', async () => {
    const { googleOAuthService } = require('../../../services/GoogleOAuthService');
    googleOAuthService.signIn.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByText, queryByText } = render(<GoogleSignInButton />);

    fireEvent.press(getByText('Continue with Google'));

    // Should show loading state
    expect(queryByText('Continue with Google')).toBeFalsy();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByText } = render(<GoogleSignInButton disabled={true} />);
    const button = getByText('Continue with Google').parent;
    expect(button?.props.disabled).toBe(true);
  });
});

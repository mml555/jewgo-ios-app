import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MagicLinkForm from '../MagicLinkForm';

// Mock the magic link service
jest.mock('../../../services/MagicLinkService', () => ({
  magicLinkService: {
    sendMagicLink: jest.fn(),
    isValidEmail: jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    formatExpirationTime: jest.fn(() => '5 minutes'),
    openEmailApp: jest.fn(),
  },
}));

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
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

describe('MagicLinkForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<MagicLinkForm />);
    expect(getByPlaceholderText('Enter your email address')).toBeTruthy();
    expect(getByText('Send Magic Link')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<MagicLinkForm />);
    
    const emailInput = getByPlaceholderText('Enter your email address');
    const sendButton = getByText('Send Magic Link');

    // Enter invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('shows error for empty email', async () => {
    const { getByText, queryByText } = render(<MagicLinkForm />);
    
    const sendButton = getByText('Send Magic Link');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText('Email is required')).toBeTruthy();
    });
  });

  it('calls onSuccess when magic link is sent successfully', async () => {
    const mockOnSuccess = jest.fn();
    const mockResult = {
      success: true,
      message: 'Magic link sent successfully',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    const { magicLinkService } = require('../../../services/MagicLinkService');
    magicLinkService.sendMagicLink.mockResolvedValue(mockResult);

    const { getByPlaceholderText, getByText } = render(
      <MagicLinkForm onSuccess={mockOnSuccess} />
    );

    const emailInput = getByPlaceholderText('Enter your email address');
    const sendButton = getByText('Send Magic Link');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        'Magic link sent successfully',
        mockResult.expiresAt
      );
    });
  });

  it('calls onError when magic link sending fails', async () => {
    const mockOnError = jest.fn();
    const mockError = new Error('Failed to send magic link');

    const { magicLinkService } = require('../../../services/MagicLinkService');
    magicLinkService.sendMagicLink.mockRejectedValue(mockError);

    const { getByPlaceholderText, getByText } = render(
      <MagicLinkForm onError={mockOnError} />
    );

    const emailInput = getByPlaceholderText('Enter your email address');
    const sendButton = getByText('Send Magic Link');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to send magic link');
    });
  });

  it('shows success state after magic link is sent', async () => {
    const mockResult = {
      success: true,
      message: 'Magic link sent successfully',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    const { magicLinkService } = require('../../../services/MagicLinkService');
    magicLinkService.sendMagicLink.mockResolvedValue(mockResult);

    const { getByPlaceholderText, getByText, queryByText } = render(<MagicLinkForm />);

    const emailInput = getByPlaceholderText('Enter your email address');
    const sendButton = getByText('Send Magic Link');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText('Check Your Email')).toBeTruthy();
      expect(queryByText('Resend Magic Link')).toBeTruthy();
    });
  });

  it('shows loading state during sending', async () => {
    const { magicLinkService } = require('../../../services/MagicLinkService');
    magicLinkService.sendMagicLink.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByPlaceholderText, getByText, queryByText } = render(<MagicLinkForm />);

    const emailInput = getByPlaceholderText('Enter your email address');
    const sendButton = getByText('Send Magic Link');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(sendButton);

    // Should show loading state
    expect(queryByText('Sending...')).toBeTruthy();
    expect(queryByText('Send Magic Link')).toBeFalsy();
  });

  it('uses custom button text when provided', () => {
    const { getByText } = render(
      <MagicLinkForm buttonText="Send Registration Link" />
    );
    expect(getByText('Send Registration Link')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByPlaceholderText, getByText } = render(
      <MagicLinkForm disabled={true} />
    );
    
    const emailInput = getByPlaceholderText('Enter your email address');
    const sendButton = getByText('Send Magic Link');
    
    expect(emailInput.props.editable).toBe(false);
    expect(sendButton.parent?.props.disabled).toBe(true);
  });
});

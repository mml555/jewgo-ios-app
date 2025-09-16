/**
 * Basic integration test to verify test setup
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Simple test component
const TestComponent: React.FC = () => (
  <View>
    <Text>Integration Test Component</Text>
  </View>
);

describe('Basic Integration Test', () => {
  it('should render test component', () => {
    const { getByText } = render(<TestComponent />);
    expect(getByText('Integration Test Component')).toBeTruthy();
  });

  it('should handle async operations', async () => {
    const asyncOperation = () => Promise.resolve('success');
    const result = await asyncOperation();
    expect(result).toBe('success');
  });

  it('should work with mocked modules', () => {
    // Test that our mocks are working
    expect(jest.isMockFunction(console.log)).toBe(true);
  });
});
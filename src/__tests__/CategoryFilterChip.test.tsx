import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryFilterChip from '../components/CategoryFilterChip';

describe('CategoryFilterChip', () => {
  const mockCategory = {
    key: 'eatery',
    label: 'Eatery',
    emoji: '🍽️',
    color: '#FF6B6B',
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly when inactive', () => {
    const { getByText } = render(
      <CategoryFilterChip
        category={mockCategory}
        isActive={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Eatery')).toBeTruthy();
    expect(getByText('🍽️')).toBeTruthy();
  });

  it('renders correctly when active', () => {
    const { getByText } = render(
      <CategoryFilterChip
        category={mockCategory}
        isActive={true}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Eatery')).toBeTruthy();
    expect(getByText('🍽️')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <CategoryFilterChip
        category={mockCategory}
        isActive={false}
        onPress={mockOnPress}
      />
    );

    fireEvent.press(getByText('Eatery'));
    expect(mockOnPress).toHaveBeenCalledWith('eatery');
  });

  it('renders in compact mode', () => {
    const { getByText } = render(
      <CategoryFilterChip
        category={mockCategory}
        isActive={false}
        onPress={mockOnPress}
        compact={true}
      />
    );

    expect(getByText('Eatery')).toBeTruthy();
    // In compact mode, emoji should not be visible
    expect(() => getByText('🍽️')).toThrow();
  });
});

/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ActionBar from '../src/components/ActionBar';

// Mock the navigation and hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../src/hooks/useFilters', () => ({
  useFilters: () => ({
    filters: {},
    showFiltersModal: false,
    applyFilters: jest.fn(),
    openFiltersModal: jest.fn(),
    closeFiltersModal: jest.fn(),
    getActiveFiltersCount: () => 0,
  }),
}));

test('renders ActionBar with hiring mode for jobs category', async () => {
  const mockOnActionPress = jest.fn();

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <ActionBar
        onActionPress={mockOnActionPress}
        currentCategory="jobs"
        jobMode="hiring"
      />,
    );
  });
});

test('renders ActionBar with seeking mode for jobs category', async () => {
  const mockOnActionPress = jest.fn();

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <ActionBar
        onActionPress={mockOnActionPress}
        currentCategory="jobs"
        jobMode="seeking"
      />,
    );
  });
});

test('renders ActionBar for non-jobs category', async () => {
  const mockOnActionPress = jest.fn();

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <ActionBar onActionPress={mockOnActionPress} currentCategory="mikvah" />,
    );
  });
});

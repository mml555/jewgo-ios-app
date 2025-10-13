import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdvancedFiltersModal from '../../../src/components/events/AdvancedFiltersModal';
import { EventCategory, EventType, EventFilters } from '../../../src/services/EventsService';

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 44,
    bottom: 34,
  }),
}));

describe('AdvancedFiltersModal', () => {
  const mockCategories: EventCategory[] = [
    { id: '1', key: 'religious', name: 'Religious & Spiritual', icon_name: 'star-of-david', sort_order: 1 },
    { id: '2', key: 'education', name: 'Education & Workshops', icon_name: 'book', sort_order: 2 },
  ];

  const mockEventTypes: EventType[] = [
    { id: '1', key: 'service', name: 'Service', sort_order: 1 },
    { id: '2', key: 'workshop', name: 'Workshop', sort_order: 2 },
  ];

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onApplyFilters: jest.fn(),
    categories: mockCategories,
    eventTypes: mockEventTypes,
    currentFilters: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when visible', () => {
    const { getByText } = render(<AdvancedFiltersModal {...defaultProps} />);
    
    expect(getByText('Advanced Filters')).toBeTruthy();
    expect(getByText('Date Range')).toBeTruthy();
    expect(getByText('Event Type')).toBeTruthy();
    expect(getByText('Tags')).toBeTruthy();
    expect(getByText('Location')).toBeTruthy();
    expect(getByText('Event Options')).toBeTruthy();
  });

  it('does not render modal when not visible', () => {
    const { queryByText } = render(
      <AdvancedFiltersModal {...defaultProps} visible={false} />
    );
    
    expect(queryByText('Advanced Filters')).toBeNull();
  });

  it('calls onClose when Cancel button is pressed', () => {
    const { getByText } = render(<AdvancedFiltersModal {...defaultProps} />);
    
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onApplyFilters when Apply button is pressed', () => {
    const { getByText } = render(<AdvancedFiltersModal {...defaultProps} />);
    
    const applyButton = getByText('Apply');
    fireEvent.press(applyButton);

    expect(defaultProps.onApplyFilters).toHaveBeenCalledTimes(1);
    expect(defaultProps.onApplyFilters).toHaveBeenCalledWith({});
  });

  it('updates filters when form inputs change', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AdvancedFiltersModal {...defaultProps} />
    );

    // Test date range inputs
    const fromInput = getByPlaceholderText('YYYY-MM-DD');
    fireEvent.changeText(fromInput, '2024-01-15');

    // Test tags input
    const tagsInput = getByPlaceholderText('Enter tags separated by commas');
    fireEvent.changeText(tagsInput, 'test, event');

    // Test zip code input
    const zipInput = getByPlaceholderText('Enter zip code');
    fireEvent.changeText(zipInput, '10001');

    // Apply filters
    const applyButton = getByText('Apply');
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(defaultProps.onApplyFilters).toHaveBeenCalledWith({
        dateFrom: '2024-01-15',
        tags: ['test', 'event'],
        zipCode: '10001',
      });
    });
  });

  it('handles toggle switches correctly', () => {
    const { getByText } = render(<AdvancedFiltersModal {...defaultProps} />);

    // Test free events toggle
    const freeEventsToggle = getByText('Free Events Only').parent?.parent;
    if (freeEventsToggle) {
      fireEvent.press(freeEventsToggle);
    }

    // Test RSVP required toggle
    const rsvpToggle = getByText('RSVP Required').parent?.parent;
    if (rsvpToggle) {
      fireEvent.press(rsvpToggle);
    }

    const applyButton = getByText('Apply');
    fireEvent.press(applyButton);

    expect(defaultProps.onApplyFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        isFree: true,
        isRsvpRequired: true,
      })
    );
  });

  it('handles event type selection', () => {
    const { getByText } = render(<AdvancedFiltersModal {...defaultProps} />);

    // Select Service event type
    const serviceChip = getByText('Service');
    fireEvent.press(serviceChip);

    const applyButton = getByText('Apply');
    fireEvent.press(applyButton);

    expect(defaultProps.onApplyFilters).toHaveBeenCalledWith({
      eventType: 'service',
    });
  });

  it('handles sort options', () => {
    const { getByText } = render(<AdvancedFiltersModal {...defaultProps} />);

    // Select Date sort option
    const dateSort = getByText('Date');
    fireEvent.press(dateSort);

    const applyButton = getByText('Apply');
    fireEvent.press(applyButton);

    expect(defaultProps.onApplyFilters).toHaveBeenCalledWith({
      sortBy: 'event_date',
    });
  });

  it('calls onApplyFilters with empty object when Clear All is pressed', () => {
    const { getByText } = render(<AdvancedFiltersModal {...defaultProps} />);

    const clearAllButton = getByText('Clear All');
    fireEvent.press(clearAllButton);

    expect(defaultProps.onApplyFilters).toHaveBeenCalledWith({});
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays current filters count correctly', () => {
    const currentFilters: EventFilters = {
      category: 'religious',
      isFree: true,
      zipCode: '10001',
    };

    const { getByText } = render(
      <AdvancedFiltersModal {...defaultProps} currentFilters={currentFilters} />
    );

    expect(getByText('3 filters applied')).toBeTruthy();
  });

  it('displays singular filter count correctly', () => {
    const currentFilters: EventFilters = {
      category: 'religious',
    };

    const { getByText } = render(
      <AdvancedFiltersModal {...defaultProps} currentFilters={currentFilters} />
    );

    expect(getByText('1 filter applied')).toBeTruthy();
  });

  it('has proper accessibility labels', () => {
    const { getByLabelText } = render(<AdvancedFiltersModal {...defaultProps} />);

    expect(getByLabelText('Start date filter')).toBeTruthy();
    expect(getByLabelText('End date filter')).toBeTruthy();
    expect(getByLabelText('Tags filter')).toBeTruthy();
    expect(getByLabelText('Zip code filter')).toBeTruthy();
    expect(getByLabelText('Filter for free events only')).toBeTruthy();
    expect(getByLabelText('Filter for events requiring RSVP')).toBeTruthy();
  });
});

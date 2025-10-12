import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EventCard from '../../../src/components/events/EventCard';
import { Event } from '../../../src/services/EventsService';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('EventCard', () => {
  const mockEvent: Event = {
    id: '1',
    organizer_id: 'organizer-1',
    title: 'Test Event',
    description: 'Test description',
    event_date: '2024-01-15T18:00:00Z',
    timezone: 'America/New_York',
    zip_code: '10001',
    venue_name: 'Test Venue',
    flyer_url: 'https://example.com/flyer.jpg',
    flyer_thumbnail_url: 'https://example.com/thumbnail.jpg',
    category_id: 'cat-1',
    category_name: 'Religious & Spiritual',
    category_icon: 'church',
    category_key: 'religious',
    event_type_id: 'type-1',
    event_type_name: 'Service',
    event_type_key: 'service',
    tags: ['test', 'event'],
    host: 'Test Host',
    contact_email: 'test@example.com',
    capacity: 100,
    is_rsvp_required: true,
    rsvp_count: 50,
    waitlist_count: 0,
    is_sponsorship_available: false,
    is_nonprofit: false,
    is_paid: false,
    is_free: true,
    status: 'approved',
    view_count: 100,
    organizer_first_name: 'John',
    organizer_last_name: 'Doe',
    organizer_full_name: 'John Doe',
    has_rsvped: false,
    capacity_percentage: 50,
    display_date_range: 'January 15 Monday 6:00 PM',
    display_date_range_formatted: 'January 15 Monday 6:00 PM',
    event_status: 'upcoming',
    is_past: false,
    is_happening_now: false,
    location_display: 'Test Venue',
    created_at: '2024-01-01T00:00:00Z',
    expires_at: '2024-01-16T00:00:00Z',
  };

  const defaultProps = {
    event: mockEvent,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders event information correctly', () => {
    const { getByText, getByTestId } = render(<EventCard {...defaultProps} />);

    expect(getByText('Test Event')).toBeTruthy();
    expect(getByText('Religious & Spiritual')).toBeTruthy();
    expect(getByText('10001')).toBeTruthy();
    expect(getByText('Free')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <EventCard {...defaultProps} onPress={mockOnPress} />
    );

    const card = getByTestId('event-card');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows heart icon when onFavoritePress is provided', () => {
    const mockOnFavoritePress = jest.fn();
    const { getByTestId } = render(
      <EventCard
        {...defaultProps}
        onFavoritePress={mockOnFavoritePress}
        isFavorited={false}
      />
    );

    const heartIcon = getByTestId('heart-icon');
    expect(heartIcon).toBeTruthy();
  });

  it('calls onFavoritePress when heart icon is pressed', () => {
    const mockOnFavoritePress = jest.fn();
    const { getByTestId } = render(
      <EventCard
        {...defaultProps}
        onFavoritePress={mockOnFavoritePress}
        isFavorited={false}
      />
    );

    const heartIcon = getByTestId('heart-icon');
    fireEvent.press(heartIcon);

    expect(mockOnFavoritePress).toHaveBeenCalledTimes(1);
  });

  it('shows correct heart icon based on favorite status', () => {
    const { rerender, getByText } = render(
      <EventCard {...defaultProps} onFavoritePress={jest.fn()} isFavorited={false} />
    );

    expect(getByText('🤍')).toBeTruthy();

    rerender(
      <EventCard {...defaultProps} onFavoritePress={jest.fn()} isFavorited={true} />
    );

    expect(getByText('❤️')).toBeTruthy();
  });

  it('shows correct price badge for free events', () => {
    const { getByText } = render(<EventCard {...defaultProps} />);
    expect(getByText('Free')).toBeTruthy();
  });

  it('shows correct price badge for paid events', () => {
    const paidEvent = { ...mockEvent, is_paid: true, is_free: false };
    const { getByText } = render(<EventCard {...defaultProps} event={paidEvent} />);
    expect(getByText('Paid')).toBeTruthy();
  });

  it('has proper accessibility labels', () => {
    const { getByLabelText } = render(<EventCard {...defaultProps} />);

    expect(getByLabelText('Event: Test Event')).toBeTruthy();
    expect(getByLabelText('Tap to view event details')).toBeTruthy();
  });

  it('has proper accessibility labels for favorite button', () => {
    const { getByLabelText } = render(
      <EventCard {...defaultProps} onFavoritePress={jest.fn()} isFavorited={false} />
    );

    expect(getByLabelText('Add to favorites')).toBeTruthy();
  });
});

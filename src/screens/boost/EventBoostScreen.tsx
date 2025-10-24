import React from 'react';
import { useNavigation } from '@react-navigation/native';
import BoostTemplate from '../../components/boost/BoostTemplate';
import { BoostPalette } from '../../styles/boostTheme';

export default function EventBoostScreen() {
  const nav = useNavigation<any>();
  return (
    <BoostTemplate
      accent={BoostPalette.events.accent}
      bg={BoostPalette.events.bg}
      title="Event Boost"
      headline="Turn Moments Into Crowds."
      subcopy="Share your upcoming event, gather attendees, and make sure your community knows what\'s happening."
      features={[
        {
          title: '1 Month of Visibility',
          desc: 'Each event stays live for up to one month, giving you time to promote, fill seats, and keep momentum leading up to the big day.',
        },
        {
          title: 'Direct Booking or RSVP Link',
          desc: 'Add a link to your ticketing page, WhatsApp, or RSVP form so users can take action instantly no extra steps needed.',
        },
        {
          title: 'Community Reach',
          desc: "Your event appears in the Jewgo Events feed and map, helping locals discover, share, and attend what's happening nearby.",
        },
      ]}
      ctaLabel="$39.99 per event  •  Get started"
      onClose={() => nav.goBack()}
      onCTAPress={() => nav.navigate('PaymentInfo')}
    />
  );
}

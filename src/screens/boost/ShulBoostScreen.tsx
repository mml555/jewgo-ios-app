import React from 'react';
import { useNavigation } from '@react-navigation/native';
import BoostTemplate from '../../components/boost/BoostTemplate';
import { BoostPalette } from '../../styles/boostTheme';

export default function ShulBoostScreen() {
  const nav = useNavigation<any>();
  return (
    <BoostTemplate
      accent={BoostPalette.shul.accent}
      bg={BoostPalette.shul.bg}
      title="Shul Boost"
      headline="Help People Find Minyan Faster."
      subcopy="Feature nusach, minyan times, and accessibility information up front."
      features={[
        {
          icon: 'calendar',
          title: 'Minyan Highlights',
          desc: 'Shacharis, Mincha, Maariv surfaced clearly.',
        },
        {
          icon: 'users',
          title: 'Community Reach',
          desc: 'Higher visibility in nearby results.',
        },
        {
          icon: 'accessibility',
          title: 'Accessibility',
          desc: 'Wheelchair access and amenities displayed.',
        },
      ]}
      ctaLabel="Coming Soon"
      onClose={() => nav.goBack()}
      onCTAPress={() => nav.navigate('Waitlist', { type: 'shul' })}
    />
  );
}

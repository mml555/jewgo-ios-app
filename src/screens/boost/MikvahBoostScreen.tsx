import React from 'react';
import { useNavigation } from '@react-navigation/native';
import BoostTemplate from '../../components/boost/BoostTemplate';
import { BoostPalette } from '../../styles/boostTheme';

export default function MikvahBoostScreen() {
  const nav = useNavigation<any>();
  return (
    <BoostTemplate
      accent={BoostPalette.mikvah.accent}
      bg={BoostPalette.mikvah.bg}
      title="Mikvah Boost"
      headline="Increase Visibility, Respectfully."
      subcopy="Amplify hours, amenities, and directions with clarity and dignity."
      features={[
        {
          icon: 'info',
          title: 'Prominent Info',
          desc: 'Hours, phone, and location prioritized.',
        },
        {
          icon: 'shield',
          title: 'Trust & Safety',
          desc: 'Verified details and respectful presentation.',
        },
        {
          icon: 'map',
          title: 'Map Priority',
          desc: 'Higher placement on the map near users.',
        },
      ]}
      ctaLabel="⚡ $49.99/mo Click to pay"
      onClose={() => nav.goBack()}
      onCTAPress={() => nav.navigate('PaymentInfo')}
    />
  );
}

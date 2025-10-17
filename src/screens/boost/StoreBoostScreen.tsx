import React from 'react';
import { useNavigation } from '@react-navigation/native';
import BoostTemplate from '../../components/boost/BoostTemplate';
import { BoostPalette } from '../../styles/boostTheme';

export default function StoreBoostScreen() {
  const nav = useNavigation<any>();
  return (
    <BoostTemplate
      accent={BoostPalette.store.accent}
      bg={BoostPalette.store.bg}
      title="Store Boost"
      headline="Put Your Store Front and Center."
      subcopy="Feature your shop, highlight offers, and drive WhatsApp or site traffic."
      features={[
        {
          icon: 'shopping-bag',
          title: 'Featured Placement',
          desc: 'Rise to the top of local store results.',
        },
        {
          icon: 'message-circle',
          title: 'Direct Messages',
          desc: 'WhatsApp link for quick orders and inquiries.',
        },
        {
          icon: 'bar-chart-2',
          title: 'Insights',
          desc: 'See views and clicks right from your dashboard.',
        },
      ]}
      ctaLabel="$49.99/mo  •  Coming Soon"
      onClose={() => nav.goBack()}
      onCTAPress={() => nav.navigate('Waitlist', { type: 'store' })}
    />
  );
}

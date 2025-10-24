import React from 'react';
import { useNavigation } from '@react-navigation/native';
import BoostTemplate from '../../components/boost/BoostTemplate';
import { BoostPalette } from '../../styles/boostTheme';

export default function EateryBoostScreen() {
  const nav = useNavigation<any>();
  return (
    <BoostTemplate
      accent={BoostPalette.eatery.accent}
      bg={BoostPalette.eatery.bg}
      title="Eatery Boost ⚡"
      headline="Turn Your Listing Into a Sales Machine."
      subcopy="Give your restaurant the tools to get noticed, drive orders, and keep customers coming back."
      features={[
        {
          icon: 'shopping-cart',
          title: 'Order Now Button',
          desc: 'Customize this button to take users straight to your online ordering page, WhatsApp, or delivery platform no extra clicks, no friction.',
        },
        {
          icon: 'gift',
          title: 'Weekly Specials Showcase',
          desc: 'Post up to 3 specials per week to keep your eatery top-of-mind and bring customers back consistently.',
        },
        {
          icon: 'camera',
          title: 'Social Links Integration',
          desc: 'Grow your following directly from Jewgo. Connect your Instagram, Facebook, or TikTok to strengthen your brand identity.',
        },
      ]}
      ctaLabel="⚡ $99.99/mo Click to pay"
      cardHeightPct={0.52}
      onClose={() => nav.goBack()}
      onCTAPress={() => nav.navigate('PaymentInfo')}
    />
  );
}

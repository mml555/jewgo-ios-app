import React from 'react';
import { useNavigation } from '@react-navigation/native';
import BoostTemplate from '../../components/boost/BoostTemplate';
import { BoostPalette } from '../../styles/boostTheme';

export default function SpecialsBoostScreen() {
  const nav = useNavigation<any>();
  return (
    <BoostTemplate
      accent={BoostPalette.specials.accent}
      bg={BoostPalette.specials.bg}
      textColor="#292B2D"
      title="Specials Boost"
      headline="Keep Customers Coming Back."
      subcopy="Add your weekly deals, giveaways, and promotions to reach the right people right when they\'re ready to buy."
      features={[
        {
          title: 'Weekly Exposure',
          desc: 'List specials and appear directly in the Jewgo Specials feed, where locals look for fresh deals every day.',
        },
        {
          title: 'Direct Traffic to Your Store or Site',
          desc: 'Add a code, link, or simple instructions to send users straight to your checkout, website, or physical location no middleman.',
        },
        {
          title: 'Consistent Customer Retention',
          desc: 'Keep your audience engaged with new offers, updates, and rotating specials that pull customers back in week after week.',
        },
      ]}
      ctaLabel="1 special free  •  then $9.99/special"
      onClose={() => nav.goBack()}
      onCTAPress={() => nav.navigate('Checkout', { type: 'special' })}
    />
  );
}

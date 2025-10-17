import React from 'react';
import { useNavigation } from '@react-navigation/native';
import BoostTemplate from '../../components/boost/BoostTemplate';
import { BoostPalette } from '../../styles/boostTheme';

export default function JobBoostScreen() {
  const nav = useNavigation<any>();
  return (
    <BoostTemplate
      accent={BoostPalette.jobs?.accent || '#3b82f6'}
      bg={BoostPalette.jobs?.bg || '#eff6ff'}
      title="Job Boost ⚡"
      headline="Find the Perfect Candidate Faster."
      subcopy="Make your job listing stand out and connect with qualified candidates in the Jewish community."
      features={[
        {
          icon: 'briefcase',
          title: 'Featured Listing',
          desc: 'Place your job at the top of search results to get maximum visibility and more qualified applicants.',
        },
        {
          icon: 'users',
          title: 'Direct Contact Button',
          desc: 'Add a prominent contact button that lets candidates reach you instantly via email, phone, or WhatsApp.',
        },
        {
          icon: 'trending-up',
          title: 'Enhanced Analytics',
          desc: 'Track views, clicks, and applications to understand how your job listing performs and optimize it.',
        },
      ]}
      ctaLabel="⚡ $49.99/mo Click to pay"
      cardHeightPct={0.52}
      onClose={() => nav.goBack()}
      onCTAPress={() => nav.navigate('Checkout', { type: 'jobs' })}
    />
  );
}

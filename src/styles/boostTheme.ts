// Centralized design tokens for Boost suite
export const BoostPalette = {
  text: '#292B2D',
  eatery: {
    accent: '#F1C1FF',
    bg: '#FFF6F7',
    gradient: 'linear(180deg, #F1C1FF 0%, #FFF6F7 100%)',
    text: '#292B2D',
    context: 'Premium tier, conversions',
  },
  specials: {
    accent: '#FFF1BA',
    bg: '#FFFAE4',
    gradient: 'linear(180deg, #FFF1BA 0%, #FFFAE4 100%)',
    text: '#292B2D',
    context: 'Deals, promotions',
  },
  events: {
    accent: '#FFAE8C',
    bg: '#FDF0E8',
    gradient: 'linear(180deg, #FFAE8C 0%, #FDF0E8 100%)',
    text: '#292B2D',
    context: 'Event visibility',
  },
  store: {
    accent: '#C6FFD1',
    bg: '#EFFFF8',
    gradient: 'linear(180deg, #C6FFD1 0%, #EFFFF8 100%)',
    text: '#292B2D',
    context: 'Store promotions',
  }, // Phase 2
  mikvah: {
    accent: '#4A90E2',
    bg: '#E9F3FF',
    gradient: 'linear(180deg, #4A90E2 0%, #E9F3FF 100%)',
    text: '#292B2D',
    context: 'Mikvah services',
  }, // complementary
  shul: {
    accent: '#2E8B57',
    bg: '#E8F7EF',
    gradient: 'linear(180deg, #2E8B57 0%, #E8F7EF 100%)',
    text: '#292B2D',
    context: 'Synagogue services',
  }, // complementary
  jobs: {
    accent: '#3b82f6',
    bg: '#eff6ff',
    gradient: 'linear(180deg, #3b82f6 0%, #eff6ff 100%)',
    text: '#292B2D',
    context: 'Job listings and career opportunities',
  },
} as const;

export type BoostKind = keyof typeof BoostPalette;

// Utility function to get gradient colors for React Native LinearGradient
export const getBoostGradientColors = (
  boostType: BoostKind,
): [string, string] => {
  const palette = BoostPalette[boostType];
  if (typeof palette === 'string') {
    return [palette, palette];
  }
  return [palette.accent, palette.bg];
};

// Utility function to get all boost colors for a specific type
export const getBoostColors = (boostType: BoostKind) => {
  const palette = BoostPalette[boostType];
  if (typeof palette === 'string') {
    return {
      accent: palette,
      background: palette,
      text: palette,
      gradientColors: getBoostGradientColors(boostType),
      context: 'Default text color',
    };
  }
  return {
    accent: palette.accent,
    background: palette.bg,
    text: palette.text,
    gradientColors: getBoostGradientColors(boostType),
    context: palette.context,
  };
};

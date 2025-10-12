// Icon.tsx
import React, { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export type IconLibrary = 'Feather' | 'Ionicons' | 'MaterialCommunityIcons' | 'MaterialIcons';

/**
 * Full catalog (Apple/Google removed)
 *
 * App elements mapped to concrete glyph names per library:
 * - Feather: heart, arrow-left, eye, home, user, bell, search, shopping-bag, briefcase, calendar, filter,
 *            plus-circle, share-2, file, users, phone, globe, mail, clock, star, edit, flag, info, map, map-pin
 * - MaterialCommunityIcons (MDI): tag, synagogue, pool, email-alert, alert-circle
 * - Ionicons: restaurant
 */
export type IconName =
  | 'heart'
  | 'arrow-left'
  | 'eye'
  | 'tag'
  | 'home'
  | 'user'
  | 'bell'
  | 'search'
  | 'synagogue'
  | 'pool'
  | 'restaurant'
  | 'shopping-bag'
  | 'briefcase'
  | 'calendar'
  | 'filter'
  | 'plus-circle'
  | 'share-2'
  | 'alert-circle'      // used for "Report (report problem)"
  | 'file'
  | 'users'
  | 'phone'
  | 'globe'
  | 'mail'
  | 'email-alert'
  | 'clock'
  | 'star'
  | 'edit'
  | 'flag'
  | 'info'
  | 'map'
  | 'map-pin';

type IconMeta = { lib: IconLibrary; name: string };

const ICONS: Record<IconName, IconMeta> = {
  // Feather
  'heart':          { lib: 'Feather', name: 'heart' },
  'arrow-left':     { lib: 'Feather', name: 'arrow-left' },
  'eye':            { lib: 'Feather', name: 'eye' },
  'home':           { lib: 'Feather', name: 'home' },
  'user':           { lib: 'Feather', name: 'user' },
  'bell':           { lib: 'Feather', name: 'bell' },
  'search':         { lib: 'Feather', name: 'search' },
  'shopping-bag':   { lib: 'Feather', name: 'shopping-bag' },
  'briefcase':      { lib: 'Feather', name: 'briefcase' },
  'calendar':       { lib: 'Feather', name: 'calendar' },
  'filter':         { lib: 'Feather', name: 'filter' },
  'plus-circle':    { lib: 'Feather', name: 'plus-circle' },
  'share-2':        { lib: 'Feather', name: 'share-2' },
  'file':           { lib: 'Feather', name: 'file' },
  'users':          { lib: 'Feather', name: 'users' },
  'phone':          { lib: 'Feather', name: 'phone' },
  'globe':          { lib: 'Feather', name: 'globe' },
  'mail':           { lib: 'Feather', name: 'mail' },
  'clock':          { lib: 'Feather', name: 'clock' },
  'star':           { lib: 'Feather', name: 'star' },
  'edit':           { lib: 'Feather', name: 'edit' },
  'flag':           { lib: 'Feather', name: 'flag' },
  'info':           { lib: 'Feather', name: 'info' },
  'map':            { lib: 'Feather', name: 'map' },
  'map-pin':        { lib: 'Feather', name: 'map-pin' },

  // MaterialCommunityIcons (MDI)
  'tag':            { lib: 'MaterialCommunityIcons', name: 'tag' },
  'pool':           { lib: 'MaterialCommunityIcons', name: 'pool' },
  'email-alert':    { lib: 'MaterialCommunityIcons', name: 'email-alert' },
  'alert-circle':   { lib: 'MaterialCommunityIcons', name: 'alert-circle' },

  // MaterialIcons
  'synagogue':      { lib: 'MaterialIcons', name: 'synagogue' },

  // Ionicons
  'restaurant':     { lib: 'Ionicons', name: 'restaurant' },
};

export interface IconProps {
  /** Catalog name (strict union) */
  name: IconName;
  /** Size in dp; defaults to 24 */
  size?: number;
  /** Color string; defaults to #292B2D (Jet Black from your palette) */
  color?: string;
  /** Optional style for alignment/margins/etc. */
  style?: StyleProp<TextStyle>;
  /** A11y label override; defaults to the icon name */
  accessibilityLabel?: string;
  /** Test hook */
  testID?: string;
}

/**
 * Preload all icon fonts once (e.g., in App.tsx) to avoid first-render flashes.
 * Usage: await preloadIconFonts();
 */
export async function preloadIconFonts(): Promise<void> {
  try {
    // Try to load fonts if the method exists
    const loadPromises = [];
    
    if (typeof (Feather as any).loadFont === 'function') {
      loadPromises.push((Feather as any).loadFont());
    }
    if (typeof (Ionicons as any).loadFont === 'function') {
      loadPromises.push((Ionicons as any).loadFont());
    }
    if (typeof (MaterialCommunityIcons as any).loadFont === 'function') {
      loadPromises.push((MaterialCommunityIcons as any).loadFont());
    }
    if (typeof (MaterialIcons as any).loadFont === 'function') {
      loadPromises.push((MaterialIcons as any).loadFont());
    }
    
    if (loadPromises.length > 0) {
      await Promise.all(loadPromises);
    } else {
      // loadFont doesn't exist, fonts are loaded automatically
      console.log('Font loading methods not found - fonts should load automatically');
    }
  } catch (error) {
    // Log but don't fail - fonts might load automatically anyway
    console.warn('Font preload attempted but encountered issue:', error);
    throw error;
  }
}

/** Runtime guard (should never happen with strict typing) */
function fallbackRender(props: Omit<IconProps, 'name'>) {
  return <Feather name="info" size={props.size} color={props.color} style={props.style} />;
}

/** Single entry-point icon component */
const Icon = memo(function Icon({
  name,
  size = 24,
  color = '#292B2D',
  style,
  accessibilityLabel,
  testID,
}: IconProps) {
  const meta = ICONS[name];
  if (!meta) return fallbackRender({ size, color, style });

  const common = {
    size,
    color,
    style,
    accessibilityLabel: accessibilityLabel ?? name,
    testID: testID ?? `icon-${name}`,
  };

  switch (meta.lib) {
    case 'Feather':
      return <Feather name={meta.name as any} {...common} />;
    case 'Ionicons':
      return <Ionicons name={meta.name as any} {...common} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={meta.name as any} {...common} />;
    case 'MaterialIcons':
      return <MaterialIcons name={meta.name as any} {...common} />;
    default:
      return fallbackRender(common);
  }
});

Icon.displayName = 'Icon';

export default Icon;

/** Optional: export the catalog for build-time validation or tooling */
export const ICON_CATALOG = Object.freeze(ICONS);

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

type Feature = { icon?: string; title: string; desc: string };

type Props = {
  accent: string;
  bg: string;
  textColor?: string;
  title: string;
  headline: string;
  subcopy: string;
  features: Feature[]; // up to 3
  ctaLabel: string;
  onClose: () => void;
  onCTAPress: () => void;

  /** Optional tunables per screen */
  cardHeightPct?: number; // default 0.52 (52% of viewport)
  ctaBottomOffsetPx?: number; // extra lift above safe-area; default auto
};

const BoostTemplate: React.FC<Props> = memo(p => {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const text = p.textColor ?? '#292B2D';

  // ——— Layout guards
  const cardHeightPct = Math.max(0.48, Math.min(p.cardHeightPct ?? 0.52, 0.6)); // 48–60%
  // Thumb-height offset: float ~100px above bottom safe area on mainstream phones,
  // slightly higher on tall phones so it reads as "floating", not footer.
  const autoThumbOffset = height >= 850 ? 112 : height >= 812 ? 100 : 88; // 15 Pro+ / 13-14 / SE-ish
  const ctaBottomOffsetPx =
    (p.ctaBottomOffsetPx ?? autoThumbOffset) + insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      {/* Close */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={p.onClose}
        style={[
          styles.closeBtn,
          { top: Math.max(insets.top, 8) + 8, right: 16 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="x" size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Banner */}
      <View
        style={[
          styles.banner,
          { backgroundColor: p.accent, marginTop: Math.max(insets.top, 8) + 6 },
        ]}
      >
        <Text style={[styles.bannerText, { color: text }]} numberOfLines={1}>
          {p.title}
        </Text>
        <Icon name="zap" size={18} color={text} />
      </View>

      {/* MAIN COLUMN (kept stable) */}
      <View style={styles.main}>
        <Text style={[styles.h1, { color: text }]} numberOfLines={2}>
          {p.headline}
        </Text>
        <Text style={[styles.sub, { color: text }]} numberOfLines={3}>
          {p.subcopy}
        </Text>

        {/* Card (fixed percentage height, so background breathes) */}
        <View
          style={[
            styles.card,
            {
              height: `${Math.round(cardHeightPct * 100)}%`,
              width: Math.min(0.92 * width, 640),
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: text }]}>What you get?</Text>

          <View style={styles.featuresWrap}>
            {p.features.slice(0, 3).map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View
                  style={[styles.featurePill, { backgroundColor: p.accent }]}
                >
                  <Icon name={f.icon ?? 'check'} size={16} color={text} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text
                    style={[styles.featureTitle, { color: text }]}
                    numberOfLines={1}
                  >
                    {f.title}
                  </Text>
                  <Text
                    style={[styles.featureDesc, { color: text }]}
                    numberOfLines={2}
                  >
                    {f.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* THUMB-HEIGHT CTA RAIL (absolute, never overlaps content visually) */}
      <View
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFillObject,
          { justifyContent: 'flex-end', alignItems: 'center' },
        ]}
      >
        <View style={[styles.ctaRail, { bottom: ctaBottomOffsetPx }]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={p.onCTAPress}
            style={[styles.cta, { backgroundColor: p.accent }]}
          >
            <Icon name="zap" size={18} color={text} />
            <Text style={[styles.ctaText, { color: text }]} numberOfLines={1}>
              {p.ctaLabel}
            </Text>
          </TouchableOpacity>
          <Text style={styles.legal} numberOfLines={1}>
            cancel anytime after the first billing cycle
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(41,43,45,0.40)',
  },

  banner: {
    alignSelf: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '82%',
  },
  bannerText: { fontWeight: '700', letterSpacing: 0.2, fontSize: 14 },

  main: { flex: 1, paddingHorizontal: 16 },
  h1: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 28,
    marginTop: 6,
    marginBottom: 6,
  },
  sub: {
    textAlign: 'center',
    opacity: 0.85,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
    paddingHorizontal: 8,
  },

  card: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },

  featuresWrap: { flex: 1, justifyContent: 'space-between', gap: 4 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  featurePill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureTextCol: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700' },
  featureDesc: { fontSize: 12, lineHeight: 16, opacity: 0.9, marginTop: 2 },

  // CTA rail (absolute)
  ctaRail: {
    width: '92%',
    alignItems: 'center',
  },
  cta: {
    width: '100%',
    minHeight: 48,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  ctaText: { fontSize: 18, fontWeight: '700' },
  legal: { marginTop: 6, fontSize: 11, opacity: 0.7, textAlign: 'center' },
});

export default BoostTemplate;

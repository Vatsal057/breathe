/**
 * Shared UI kit — Vibrant Ivory & Nocturnal Ember.
 * Adapts dynamically to light and dark theme with impeccable contrast,
 * tactile hairlines, and purposeful, slop-free layout rhythm.
 */
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radii, spacing, useTheme } from '../theme';

export function Screen({
  children,
  style,
  noPaddingBottom,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noPaddingBottom?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.ink,
          paddingTop: insets.top,
          paddingBottom: noPaddingBottom ? 0 : insets.bottom,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Refined uppercase tracked section header. */
export function SectionLabel({
  children,
  style,
  gold,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  gold?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.sectionLabel,
        { color: gold ? colors.ember : colors.ash },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Elevated surface card. */
export function Card({
  children,
  style,
  highlight,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  highlight?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: highlight ? colors.surfaceSubtle : colors.surface,
          borderColor: highlight ? colors.emberBoundary : colors.hairline,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.emberDim }}
      style={({ pressed }) => [pressed && { opacity: 0.92 }]}
    >
      {content}
    </Pressable>
  );
}

/** A quiet row divided by subtle hairlines. */
export function HairlineRow({
  children,
  onPress,
  first,
}: {
  children: ReactNode;
  onPress?: () => void;
  first?: boolean;
}) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.row,
        { borderTopColor: colors.hairline },
        first && styles.rowFirst,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.emberDim }}
      style={({ pressed }) => [pressed && { backgroundColor: colors.emberDim }]}
    >
      {content}
    </Pressable>
  );
}

/** Primary action button — vivid coral with high-contrast text. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(0,0,0,0.2)' }}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.ember },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.primaryButtonLabel, { color: '#11141C' }]}>{label}</Text>
    </Pressable>
  );
}

/** Subtle secondary outlined action button. */
export function SecondaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: colors.emberDim }}
      style={({ pressed }) => [
        styles.secondaryButton,
        {
          borderColor: colors.hairlineStrong,
          backgroundColor: 'transparent',
        },
        pressed && { backgroundColor: colors.emberDim },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.secondaryButtonLabel, { color: colors.bone }]}>{label}</Text>
    </Pressable>
  );
}

/** Compact pill badge for levels and status tags. */
export function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: 'default' | 'gold' | 'coral';
}) {
  const { colors } = useTheme();

  const isGold = variant === 'gold';
  const isCoral = variant === 'coral';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isGold
            ? colors.goldDim
            : isCoral
              ? colors.emberDim
              : colors.surfaceSubtle,
          borderColor: isGold
            ? colors.gold
            : isCoral
              ? colors.emberBoundary
              : colors.hairline,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: isGold
              ? colors.gold
              : isCoral
                ? colors.ember
                : colors.ash,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/** Minimal 1.5px toggle for light and dark surfaces. */
export function EmberToggle({ value, onPress }: { value: boolean; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      android_ripple={{ color: colors.emberDim, borderless: true }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[
        styles.toggleTrack,
        {
          borderColor: value ? colors.ember : colors.hairlineStrong,
          backgroundColor: value ? colors.emberDim : colors.surfaceSubtle,
        },
      ]}
    >
      <View
        style={[
          styles.toggleKnob,
          {
            backgroundColor: value ? colors.ember : colors.ashMuted,
            alignSelf: value ? 'flex-end' : 'flex-start',
          },
        ]}
      />
    </Pressable>
  );
}

/** Screen title with serif font and crisp line height. */
export function ScreenTitle({
  children,
  subtitle,
  style,
}: {
  children: ReactNode;
  subtitle?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.titleWrap}>
      <Text style={[styles.screenTitle, { color: colors.bone }, style]}>{children}</Text>
      {subtitle ? (
        <Text style={[styles.screenSubtitle, { color: colors.ash }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleWrap: {
    marginBottom: spacing.xs,
  },
  screenTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  row: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  primaryButton: {
    borderRadius: radii.md,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});

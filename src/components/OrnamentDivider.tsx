/**
 * OrnamentDivider — a hairline section break with a small centered petal mark.
 * Quieter than a label, warmer than a bare rule.
 * Adapts dynamically to light and dark theme.
 */
import { StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '../theme';
import { PetalMark } from './icons';

export function OrnamentDivider() {
  const { colors } = useTheme();

  return (
    <View style={styles.row} pointerEvents="none">
      <View style={[styles.rule, { backgroundColor: colors.hairline }]} />
      <View style={styles.mark}>
        <PetalMark size={20} color={colors.ember} />
      </View>
      <View style={[styles.rule, { backgroundColor: colors.hairline }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  rule: {
    flex: 1,
    height: 1,
  },
  mark: {
    marginHorizontal: spacing.sm,
  },
});

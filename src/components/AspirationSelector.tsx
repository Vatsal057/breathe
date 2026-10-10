/**
 * AspirationSelector: an optional traditional aspiration (levels 5-12).
 *
 * Display-only. It never touches the program, which always trains toward
 * the goalLevel pace (floor 8 breaths a minute). Collapsed by default so
 * the goal picker stays clean; only deliberate users open it.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, useTheme } from '../theme';
import { Badge, Card } from './ui';
import { ANGUL_BEYOND } from '../data/angul';

const WARNING =
  'Levels 5 to 12 come from the old text. They have no measured breath-rate equivalent and this app cannot verify them. Your program still trains toward 8 breaths a minute. Set one only as an aspiration, not a target.';

export function AspirationSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(value != null);

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.toggleRow}
        accessibilityLabel="Set a traditional aspiration"
      >
        <Text style={[styles.toggleText, { color: colors.ash }]}>
          Set a traditional aspiration (optional)
        </Text>
        <Text style={[styles.toggleChevron, { color: colors.ember }]}>
          {open ? '↑' : '↓'}
        </Text>
      </Pressable>

      {open && (
        <Card style={styles.warnCard}>
          <Text style={[styles.warnText, { color: colors.ash }]}>{WARNING}</Text>
        </Card>
      )}

      {open && (
        <View style={styles.chips}>
          {ANGUL_BEYOND.map((a) => {
            const active = value === a.level;
            return (
              <Pressable
                key={a.level}
                onPress={() => onChange(active ? null : a.level)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.emberDim : colors.surfaceSubtle,
                    borderColor: active ? colors.ember : colors.hairline,
                  },
                ]}
                accessibilityLabel={`Aspire to level ${a.level}`}
              >
                <Text style={[styles.chipNum, { color: active ? colors.ember : colors.ash }]}>
                  {a.level}
                </Text>
                <Text style={[styles.chipName, { color: colors.bone }]} numberOfLines={1}>
                  {a.hindi}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {value != null && !open && (
        <View style={styles.currentRow}>
          <Badge label={`Level ${value} · aspiration`} variant="coral" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleText: {
    fontSize: 13,
  },
  toggleChevron: {
    fontSize: 14,
    fontWeight: '700',
  },
  warnCard: {
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  warnText: {
    fontSize: 13,
    lineHeight: 19,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 88,
    maxWidth: 160,
  },
  chipNum: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipName: {
    fontSize: 13,
    marginTop: 2,
  },
  currentRow: {
    marginTop: spacing.xs,
  },
});

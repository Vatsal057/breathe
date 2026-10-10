/**
 * AngulSpanGauge — Visual breath-breadth caliper.
 * Visualizes the traditional 12-angul breath span from the Shiv Swarodaya.
 * A reading, not a measurement: the app measures breaths per minute only.
 * The user's own target is shown in plain BPM beside it.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { fonts, radii, spacing, useTheme } from '../theme';

interface AngulSpanGaugeProps {
  currentBpm?: number | null;
  targetBpm?: number;
}

export function AngulSpanGauge({ currentBpm = null, targetBpm = 8 }: AngulSpanGaugeProps) {
  const { colors, isDark } = useTheme();

  // 12 angul ticks (0 to 12)
  const ticks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const gaugeWidth = 280;
  const tickSpacing = gaugeWidth / 12;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.bone }]}>The Breath Span Caliper</Text>
          <Text style={[styles.subtitle, { color: colors.ash }]}>
            The old text: the natural exhale travels 12 anguls; the practiced one, 8. Shown as tradition.
          </Text>
        </View>
        <View style={[styles.targetBadge, { backgroundColor: colors.emberDim, borderColor: colors.emberBoundary }]}>
          <Text style={[styles.targetBadgeText, { color: colors.ember }]}>Traditional map</Text>
        </View>
      </View>

      <View style={styles.svgWrap}>
        <Svg width={gaugeWidth} height={52} viewBox={`0 0 ${gaugeWidth} 52`}>
          {/* Main baseline track */}
          <Line
            x1={0}
            y1={26}
            x2={gaugeWidth}
            y2={26}
            stroke={colors.bone}
            strokeOpacity={isDark ? 0.15 : 0.12}
            strokeWidth={2}
          />

          {/* Stilled Prana Zone (0 to 8 anguls = Stilled Mastery Zone) */}
          <Rect
            x={0}
            y={14}
            width={8 * tickSpacing}
            height={24}
            rx={4}
            fill={colors.emberDim}
            stroke={colors.ember}
            strokeWidth={1}
            strokeOpacity={0.6}
            strokeDasharray="2 2"
          />

          {/* Expended breath zone (8 to 12 anguls = the 4 anguls being stilled) */}
          <Rect
            x={8 * tickSpacing}
            y={20}
            width={4 * tickSpacing}
            height={12}
            rx={2}
            fill={isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0,0,0,0.03)'}
          />

          {/* Caliper ticks */}
          {ticks.map((t) => {
            const x = t * tickSpacing;
            const isMajor = t === 0 || t === 8 || t === 10 || t === 12;
            const isTarget = t === 8;
            return (
              <Line
                key={t}
                x1={x}
                y1={isMajor ? 16 : 21}
                x2={x}
                y2={isMajor ? 36 : 31}
                stroke={isTarget ? colors.ember : colors.bone}
                strokeOpacity={isTarget ? 1 : isMajor ? 0.45 : 0.2}
                strokeWidth={isTarget ? 2 : 1}
              />
            );
          })}

          {/* Target marker indicator at 8 angul */}
          <Circle
            cx={8 * tickSpacing}
            cy={26}
            r={5}
            fill={colors.ember}
          />
          <Circle
            cx={8 * tickSpacing}
            cy={26}
            r={9}
            fill="none"
            stroke={colors.ember}
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        </Svg>
      </View>

      {/* Metric markers below gauge */}
      <View style={styles.labelRow}>
        <View style={styles.labelCol}>
          <Text style={[styles.markText, { color: colors.ember }]}>8 Angul</Text>
          <Text style={[styles.markSub, { color: colors.ash }]}>Traditional gateway</Text>
        </View>
        <View style={styles.labelColCenter}>
          <Text style={[styles.markText, { color: colors.ash }]}>10 Angul</Text>
          <Text style={[styles.markSub, { color: colors.ashMuted }]}>Inhale Span</Text>
        </View>
        <View style={styles.labelColRight}>
          <Text style={[styles.markText, { color: colors.ash }]}>12 Angul</Text>
          <Text style={[styles.markSub, { color: colors.ashMuted }]}>Normal Exhale</Text>
        </View>
      </View>

      <Text style={[styles.explainer, { color: colors.ash }]}>
        {currentBpm != null
          ? `Your resting rate: ${currentBpm} BPM. Your target: ≤${targetBpm} BPM.`
          : 'The old text says unrefined breathing casts prana 12 finger-widths outward. The practice stills it, one session at a time.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.serifSemi,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  svgWrap: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelCol: {
    alignItems: 'flex-start',
  },
  labelColCenter: {
    alignItems: 'center',
  },
  labelColRight: {
    alignItems: 'flex-end',
  },
  markText: {
    fontSize: 12,
    fontWeight: '700',
  },
  markSub: {
    fontSize: 11,
    marginTop: 1,
  },
  explainer: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
});

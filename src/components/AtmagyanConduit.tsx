/**
 * AtmagyanConduit — Sacred visual diagram of the Atmagyan bridge.
 * Faithfully illustrates the reel's Body → Prana → Soul → Divine conduit,
 * contrasting the wild/hurdle state with the refined stilled channel.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { fonts, radii, spacing, useTheme } from '../theme';

export function AtmagyanConduit() {
  const { colors, isDark } = useTheme();

  const nodes = [
    { title: 'BODY', subtitle: 'Deha · The Temple', color: colors.ash },
    { title: 'PRANA', subtitle: 'Vayu · The Living Bridge', color: colors.ember },
    { title: 'SOUL', subtitle: 'Atman · The Silent Witness', color: colors.bone },
    { title: 'DIVINE', subtitle: 'Brahman · Boundless Light', color: colors.ember },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.bone }]}>The Atmagyan Conduit</Text>
        <Text style={[styles.badge, { color: colors.ember, backgroundColor: colors.emberDim }]}>
          आत्मज्ञान सेतु
        </Text>
      </View>

      <Text style={[styles.desc, { color: colors.ash }]}>
        From Vijendra Gurjar’s breakdown of Shiv Swarodaya: Prana is the singular link
        between the physical vessel and pure consciousness.
      </Text>

      {/* Vertical Sacred Conduit Graphic */}
      <View style={styles.conduitWrap}>
        <View style={styles.nodesList}>
          {nodes.map((node, i) => (
            <View key={node.title} style={styles.nodeItem}>
              <View style={styles.nodeLeft}>
                <View
                  style={[
                    styles.nodeDot,
                    {
                      borderColor: node.color,
                      backgroundColor: i === 1 ? colors.emberDim : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.nodeDotInner, { backgroundColor: node.color }]} />
                </View>

                {i < nodes.length - 1 && (
                  <View style={styles.lineTrack}>
                    <Svg width={2} height={28}>
                      <Line
                        x1={1}
                        y1={0}
                        x2={1}
                        y2={28}
                        stroke={colors.ember}
                        strokeWidth={2}
                        strokeOpacity={isDark ? 0.35 : 0.25}
                        strokeDasharray={i === 0 ? '3 3' : undefined}
                      />
                    </Svg>
                  </View>
                )}
              </View>

              <View style={styles.nodeTextWrap}>
                <Text style={[styles.nodeTitle, { color: node.color }]}>{node.title}</Text>
                <Text style={[styles.nodeSubtitle, { color: colors.ash }]}>{node.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footerCallout, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
        <Text style={[styles.calloutText, { color: colors.bone }]}>
          <Text style={{ color: colors.ember, fontWeight: '700' }}>The Secret: </Text>
          When prana is agitated, the conduit is blocked by turbulence. When stilled to 8 anguls,
          the doorway between body and soul becomes crystal clear.
        </Text>
      </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.serifSemi,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  conduitWrap: {
    paddingVertical: spacing.xs,
  },
  nodesList: {
    gap: 0,
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
  },
  nodeLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  nodeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lineTrack: {
    height: 28,
    alignItems: 'center',
  },
  nodeTextWrap: {
    flex: 1,
    paddingTop: 1,
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  nodeSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  footerCallout: {
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.xs,
  },
  calloutText: {
    fontSize: 12,
    lineHeight: 17,
  },
});

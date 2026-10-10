/**
 * The Journey (Map): The 12 Anguls of Shiv Swarodaya.
 * Includes Atmagyan Conduit, 12 Angul horizons, and ambient BackdropBloom.
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fonts, radii, spacing, useTheme } from '../theme';
import { Badge, Card, Screen, ScreenTitle, SectionLabel } from '../components/ui';
import { CheckIcon } from '../components/icons';
import { BackdropBloom } from '../components/BackdropBloom';
import { OrnamentDivider } from '../components/OrnamentDivider';
import { AtmagyanConduit } from '../components/AtmagyanConduit';
import { ANGUL_BEYOND, type AngulLevel } from '../data/angul';
import { BREATH_LEVELS, levelForBpm } from '../data/levels';
import { loadCheckins, loadSettings } from '../storage/stats';

export function MapScreen() {
  const { colors } = useTheme();
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [showOrigins, setShowOrigins] = useState(false);
  const [aspiration, setAspiration] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadCheckins().then((c) => {
        if (alive) setCurrentBpm(c[0]?.bpm ?? null);
      });
      loadSettings().then((s) => {
        if (alive) setAspiration(s.aspirationLevel ?? null);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const activeLevel = levelForBpm(currentBpm);

  return (
    <View style={[styles.root, { backgroundColor: colors.ink }]}>
      <BackdropBloom size={540} offsetY={20} />

      <Screen noPaddingBottom style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ScreenTitle subtitle="From normal 12 anguls outward to inner still point">
            The 12 Anguls
          </ScreenTitle>

          {/* Visual Element: The Atmagyan Conduit */}
          <AtmagyanConduit />

          {/* Scriptural Context Toggle */}
          <Pressable
            onPress={() => setShowOrigins((v) => !v)}
            style={styles.originsToggle}
          >
            <Text style={[styles.originsToggleText, { color: colors.ember }]}>
              {showOrigins ? 'Hide Scriptural Origins ↑' : 'View Scriptural Lineage & Context ↓'}
            </Text>
          </Pressable>

          {showOrigins && (
            <Card style={styles.originsCard}>
              <Text style={[styles.originsTitle, { color: colors.bone }]}>The Tradition of Swarodaya</Text>
              <Text style={[styles.originsText, { color: colors.ash }]}>
                Framed as an esoteric dialogue between Lord Shiva and Devi Parvati, the Shiv Swarodaya
                (verses 216–222) maps human life force in &ldquo;anguls&rdquo; (1 angul ≈ 1.5 to 2 cm).
              </Text>
              <Text style={[styles.originsText, { color: colors.ash }]}>
                When walking, prana travels 24 anguls; when running, 42 anguls; in sleep, 100 anguls.
                By cultivating subtle, quiet nasal breathing, prana expenditure shrinks.
              </Text>
              <Text style={[styles.originsText, { color: colors.ash }]}>
                Our daily program takes its cue from this: training the resting breath down toward 8
                breaths a minute, one slow session at a time. What we measure is the breath rate —
                the rest is the tradition that inspired it.
              </Text>
            </Card>
          )}

          <OrnamentDivider />

          {/* Section 1: The 4 Active Milestones (Your Path) */}
          <View style={styles.sectionWrap}>
            <SectionLabel gold>The 4 Core Milestones (Target: Vak Siddhi)</SectionLabel>
            <View style={styles.milestoneList}>
              {BREATH_LEVELS.map((level) => {
                const isUnlocked = activeLevel != null && activeLevel.level >= level.level;
                const isCurrent = activeLevel?.level === level.level;
                return (
                  <Card
                    key={level.level}
                    style={[
                      styles.milestoneCard,
                      isCurrent && {
                        borderColor: colors.ember,
                        backgroundColor: colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <View style={styles.milestoneRow}>
                      <View
                        style={[
                          styles.milestoneNumBox,
                          {
                            backgroundColor: isUnlocked ? colors.emberDim : colors.surfaceSubtle,
                            borderColor: isUnlocked ? colors.emberBoundary : colors.hairline,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.milestoneNum,
                            { color: isUnlocked ? colors.ember : colors.ash },
                          ]}
                        >
                          {level.level}
                        </Text>
                      </View>

                      <View style={styles.milestoneContent}>
                        <View style={styles.milestoneTitleRow}>
                          <Text style={[styles.milestoneName, { color: colors.bone }]}>
                            {level.name} · {level.sanskrit}
                          </Text>
                          {isUnlocked && <CheckIcon size={16} color={colors.ember} />}
                        </View>
                        <Text style={[styles.milestoneFruit, { color: colors.ember }]}>{level.fruit}</Text>
                        <Text style={[styles.milestoneMeaning, { color: colors.ash }]}>{level.meaning}</Text>
                        <Text style={[styles.milestoneBpm, { color: colors.ashMuted }]}>
                          Threshold: Resting ≤{level.maxBpm} breaths/min
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
            <Text style={[styles.tradNote, { color: colors.ashMuted }]}>
              Level names and fruits come from the old text. We measure only your breath rate.
            </Text>
          </View>

          <Text style={[styles.threadNudge, { color: colors.ash }]}>
            Ritual: hold a thread four finger-widths under your nose on the exhale. The less it moves, the subtler your breath. The full how-to lives on the Learn tab.
          </Text>

          {/* Section 2: Transcendent Horizons (Levels 5–12) */}
          <View style={styles.sectionWrap}>
            <SectionLabel>Esoteric Horizons (Levels 5–12)</SectionLabel>
            <Text style={[styles.horizonsSub, { color: colors.ash }]}>
              Recorded in verses 219–222 of Shiv Swarodaya as traditional yogic fruits:
            </Text>
            <View style={[styles.horizonsList, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {ANGUL_BEYOND.map((item: AngulLevel) => (
                <View
                  key={item.level}
                  style={[styles.horizonRow, { borderTopColor: colors.hairline }]}
                >
                  <Text style={[styles.horizonNum, { color: colors.ashMuted }]}>{item.level}</Text>
                  <View style={styles.horizonInfo}>
                    <Text style={[styles.horizonHindi, { color: colors.bone }]}>{item.hindi}</Text>
                    <Text style={[styles.horizonEnglish, { color: colors.ash }]}>{item.english}</Text>
                  </View>
                  {aspiration === item.level && (
                    <Badge label="Aspiration" variant="coral" />
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  originsToggle: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  originsToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  originsCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  originsTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 16,
    marginBottom: 6,
  },
  originsText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  sectionWrap: {
    marginTop: spacing.sm,
  },
  milestoneList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  milestoneCard: {
    padding: spacing.md,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  milestoneNumBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 18,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneName: {
    fontFamily: fonts.serifSemi,
    fontSize: 16,
  },
  milestoneFruit: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  milestoneMeaning: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  milestoneBpm: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 8,
  },
  threadNudge: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  tradNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  horizonsSub: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  horizonsList: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  horizonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  horizonNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 16,
    minWidth: 24,
  },
  horizonInfo: {
    flex: 1,
  },
  horizonHindi: {
    fontSize: 14,
  },
  horizonEnglish: {
    fontSize: 12,
    marginTop: 2,
  },
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radii, spacing, useTheme } from '../theme';
import { Card, PrimaryButton, Screen, ScreenTitle, SecondaryButton, SectionLabel } from '../components/ui';
import { BloomStamp, CheckIcon } from '../components/icons';
import { achievementName, programStepAchievements, sessionAchievements } from '../data/achievements';
import { techniquesUnlockedAtStep } from '../data/techniques';
import { programStepAfterSession, targetBpmForStep, terminalBpmForGoal } from '../data/program';
import {
  dayKeyOf,
  loadSettings,
  loadStats,
  recordSession,
  saveSettings,
  unlockAchievements,
} from '../storage/stats';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Complete'>;

const CALM_OPTIONS = [
  { value: 1, label: 'Restless' },
  { value: 2, label: 'Settling' },
  { value: 3, label: 'Calm' },
  { value: 4, label: 'Deep Stillness' },
  { value: 5, label: 'Very still' },
];

const STREAK_MILESTONES = [7, 14, 30, 60, 100] as const;
const MILESTONE_LINES: Record<number, string> = {
  7: 'Seven consecutive days of dedicated breath mastery.',
  14: 'Fourteen days of stilled prana. The habit is taking root.',
  30: 'Thirty days of practice. The mind rests in stillness.',
  60: 'Sixty days. Your resting breath is near its target.',
  100: 'One hundred days of unwavering discipline.',
};

interface SavedTotals {
  totalMinutes: number;
  totalBreaths: number;
  streakDays: number;
}

export function CompleteScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [calm, setCalm] = useState<number | null>(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedTotals | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [milestone, setMilestone] = useState<number | null>(null);

  const { targetBpm, step, minutes: prescribedMinutes, breaths, elapsedSec, actualBpm } = route.params;
  const minutes = Math.max(1, Math.round(elapsedSec / 60));

  const save = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      const [prevStats, settings] = await Promise.all([loadStats(), loadSettings()]);
      const terminal = terminalBpmForGoal(settings.goalLevel ?? 4);
      const prevStep = settings.programStep ?? 0;
      const stats = await recordSession({ presetId: route.params.techniqueId ?? 'program', minutes, breaths, calm });
      const adv = programStepAfterSession(
        prevStep,
        settings.programStepSessions ?? 0,
        prevStats.lastSessionDay,
        dayKeyOf(new Date()),
      );
      const unlockedNow = adv.step > prevStep ? techniquesUnlockedAtStep(adv.step) : [];
      const unlockNote =
        unlockedNow.length > 0
          ? `Step ${adv.step + 1} reached · ${unlockedNow.map((t) => t.name).join(', ')} unlocked.`
          : null;
      await saveSettings({
        programStep: adv.step,
        programStepSessions: adv.stepSessions,
        programNote: adv.easedBack
          ? `Easing back in — today at ${targetBpmForStep(adv.step, terminal)} breaths a minute.`
          : unlockNote,
      });
      const { newly } = await unlockAchievements([
        ...sessionAchievements(stats),
        ...programStepAchievements(prevStep, adv.step),
      ]);
      setNewAchievements(newly.map(achievementName));
      setSaved({
        totalMinutes: stats.totalMinutes,
        totalBreaths: stats.totalBreaths,
        streakDays: stats.streakDays,
      });
      if ((STREAK_MILESTONES as readonly number[]).includes(stats.streakDays)) {
        setMilestone(stats.streakDays);
      }
    } finally {
      setSaving(false);
    }
  };

  const returnHome = () => {
    navigation.navigate('Main', { screen: 'Home' });
  };

  const breatheAgain = () => {
    navigation.replace('Session', { targetBpm, step, minutes: prescribedMinutes, techniqueId: route.params.techniqueId });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ink }]}>
      <Screen noPaddingBottom style={styles.screen}>
        <View style={styles.stampWrap}>
          <BloomStamp size={56} color={colors.ember} />
        </View>

        <ScreenTitle subtitle="Your nervous system rests in quiet coherence">
          Practice Complete
        </ScreenTitle>

        {/* Hero session stats card */}
        <Card highlight style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.bone }]}>{breaths}</Text>
              <Text style={[styles.statLabel, { color: colors.ash }]}>Breaths</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.hairline }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.bone }]}>{minutes}</Text>
              <Text style={[styles.statLabel, { color: colors.ash }]}>Minutes</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.hairline }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.bone }]}>{Math.round(actualBpm ?? targetBpm)}</Text>
              <Text style={[styles.statLabel, { color: colors.ash }]}>BPM Pace</Text>
            </View>
          </View>

          {saved && (
            <View style={[styles.cumulativeBox, { borderTopColor: colors.hairline }]}>
              <Text style={[styles.cumulativeText, { color: colors.ash }]}>
                Streak: <Text style={{ color: colors.ember, fontWeight: '700' }}>{saved.streakDays} days</Text> · Lifetime: {saved.totalMinutes} min
              </Text>
            </View>
          )}

          {newAchievements.length > 0 && (
            <Text style={[styles.achievementLine, { color: colors.ember }]}>
              Milestone Unlocked: {newAchievements.join(' · ')}
            </Text>
          )}
        </Card>

        {/* State check-in */}
        {!saved && (
          <View style={styles.sectionWrap}>
            <SectionLabel gold>State of Consciousness</SectionLabel>
            <Card style={styles.calmCard}>
              <Text style={[styles.calmPrompt, { color: colors.ash }]}>How calm and stilled is your mind?</Text>
              <View style={styles.calmOptionsList}>
                {CALM_OPTIONS.map((opt) => {
                  const active = calm === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setCalm(opt.value)}
                      style={[
                        styles.calmOptionRow,
                        {
                          backgroundColor: active ? colors.emberDim : colors.surfaceSubtle,
                          borderColor: active ? colors.ember : colors.hairline,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.calmOptionText,
                          { color: active ? colors.ember : colors.bone, fontWeight: active ? '700' : '500' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {active && <CheckIcon size={16} color={colors.ember} />}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </View>
        )}
      </Screen>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.sm,
            backgroundColor: colors.ink,
            borderTopColor: colors.hairline,
          },
        ]}
      >
        {saved ? (
          <View style={styles.footerButtons}>
            <PrimaryButton label="Return to Sanctum" onPress={returnHome} />
            <SecondaryButton label="Breathe Again" onPress={breatheAgain} />
          </View>
        ) : (
          <PrimaryButton
            label={saving ? 'Sealing Practice…' : 'Record & Seal Practice'}
            onPress={save}
            disabled={saving}
          />
        )}
      </View>

      {/* Streak Milestone Pop-up */}
      {milestone != null && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(17,20,28,0.92)' : 'rgba(246,241,231,0.92)' }]}>
          <Card highlight style={styles.milestoneCard}>
            <BloomStamp size={64} color={colors.ember} />
            <Text style={[styles.milestoneStreakNum, { color: colors.ember }]}>{milestone} Days</Text>
            <Text style={[styles.milestoneLine, { color: colors.bone }]}>{MILESTONE_LINES[milestone]}</Text>
            <View style={styles.milestoneBtnWrap}>
              <PrimaryButton label="Continue" onPress={() => setMilestone(null)} />
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    paddingBottom: 0,
  },
  stampWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  statsCard: {
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 34,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  cumulativeBox: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  cumulativeText: {
    fontSize: 13,
  },
  achievementLine: {
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionWrap: {
    marginTop: spacing.md,
  },
  calmCard: {
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  calmPrompt: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  calmOptionsList: {
    gap: 6,
  },
  calmOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
  },
  calmOptionText: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  footerButtons: {
    gap: spacing.xs,
  },
  milestoneCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  milestoneStreakNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 32,
  },
  milestoneLine: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  milestoneBtnWrap: {
    width: '100%',
    marginTop: spacing.sm,
  },
});

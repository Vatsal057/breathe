/**
 * Home: Daily Practice Sanctum.
 * Dual-theme (Vibrant Ivory & Nocturnal Ember), ambient BackdropBloom,
 * physical GrainOverlay, and the interactive AngulSpanGauge.
 */
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, radii, spacing, useTheme } from '../theme';
import { Badge, Card, PrimaryButton, Screen, SectionLabel } from '../components/ui';
import { BloomStamp, CheckIcon } from '../components/icons';
import { BackdropBloom } from '../components/BackdropBloom';
import { GrainOverlay } from '../components/Bloom';
import { OrnamentDivider } from '../components/OrnamentDivider';
import { AngulSpanGauge } from '../components/AngulSpanGauge';
import {
  SESSIONS_PER_STEP,
  effectiveProgram,
  goalHeldForWeek,
  terminalBpmForGoal,
  type ProgramState,
} from '../data/program';
import { BREATH_LEVELS } from '../data/levels';
import { displayTechniqueForStep, sessionTechniqueForStep } from '../data/techniques';
import {
  dayKeyOf,
  loadCheckins,
  loadSettings,
  loadStats,
  saveSettings,
  type RestingCheckin,
  type Stats,
} from '../storage/stats';
import {
  getReminderPermission,
  scheduleDailyReminder,
} from '../notifications/reminders';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MAINTENANCE_MINUTES = 5;
const SESSION_MINUTES = 10;

const SWARODAYA_VERSES = [
  {
    sanskrit: 'प्राणस्य बन्धने चित्तं बद्धं भवति सर्वदा।',
    english: 'When prana is stilled, the mind is stilled forever.',
  },
  {
    sanskrit: 'द्वादशाङ्गुलमानं तु श्वासस्य गमनं स्मृतम्।',
    english: 'The natural breath reaches 12 anguls outward. Each angul preserved awakens stillness.',
  },
  {
    sanskrit: 'चले वाते चलं चित्तं निश्चले निश्चलं भवेत्।',
    english: 'When breath wavers, the mind wavers. When breath is motionless, consciousness rests.',
  },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const [program, setProgram] = useState<ProgramState | null>(null);
  const [storedStep, setStoredStep] = useState(0);
  const [stepSessions, setStepSessions] = useState(0);
  const [terminalBpm, setTerminalBpm] = useState(8);
  const [maintenance, setMaintenance] = useState(false);
  const [goalLevel, setGoalLevel] = useState<number>(4);
  const [stats, setStats] = useState<Stats | null>(null);
  const [latestCheckin, setLatestCheckin] = useState<RestingCheckin | null>(null);
  const [todayDone, setTodayDone] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [verseIndex] = useState(() => Math.floor(Math.random() * SWARODAYA_VERSES.length));

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [s, settings, checkins] = await Promise.all([
          loadStats(),
          loadSettings(),
          loadCheckins(),
        ]);
        const gLevel = settings.goalLevel ?? 4;
        const terminal = terminalBpmForGoal(gLevel);
        const step = settings.programStep ?? 0;

        let achieved = settings.goalAchieved === true;
        if (!achieved && goalHeldForWeek(checkins, terminal)) {
          achieved = true;
          await saveSettings({ goalAchieved: true });
        }

        if (!alive) return;
        setStoredStep(step);
        setStepSessions(settings.programStepSessions ?? 0);
        setProgram(effectiveProgram(checkins[0]?.bpm ?? null, step, terminal));
        setTerminalBpm(terminal);
        setMaintenance(achieved);
        setGoalLevel(gLevel);
        setStats(s);
        setLatestCheckin(checkins[0] ?? null);
        setTodayDone(s.lastSessionDay === dayKeyOf(new Date()));
        setNote(settings.programNote);

        if (settings.programNote) {
          await saveSettings({ programNote: null });
        }

        if (settings.reminderOn) {
          const perm = await getReminderPermission();
          if (perm === 'granted') {
            await scheduleDailyReminder(
              settings.reminderHour,
              settings.reminderMinute,
              s.streakDays,
            );
          }
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const sessionMinutes = maintenance ? MAINTENANCE_MINUTES : SESSION_MINUTES;
  const targetBpm = maintenance ? terminalBpm : (program?.targetBpm ?? 8);
  const goalItem = BREATH_LEVELS[goalLevel - 1] ?? BREATH_LEVELS[3];
  const verse = SWARODAYA_VERSES[verseIndex];

  const startSession = () => {
    if (!program) return;
    navigation.navigate('Session', {
      targetBpm,
      step: storedStep,
      minutes: sessionMinutes,
      techniqueId: sessionTechniqueForStep(storedStep),
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ink }]}>
      {/* Ambient breathing watermark bloom behind all content */}
      <BackdropBloom size={600} offsetY={-40} />
      <GrainOverlay />

      <Screen noPaddingBottom style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Row: Title and Practice Streak */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.appTitle, { color: colors.bone }]}>Prana Pacer</Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: colors.surface, borderColor: colors.emberBoundary }]}>
              <BloomStamp size={18} color={colors.ember} />
              <Text style={[styles.streakText, { color: colors.bone }]}>
                {stats?.streakDays ?? 0} {stats?.streakDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>

          {/* Hero Prescription Card */}
          <Card highlight style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Badge
                label={maintenance ? 'Maintenance Pace' : `Step ${storedStep + 1} of 4`}
                variant="coral"
              />
              {todayDone && (
                <View style={styles.donePill}>
                  <CheckIcon size={14} color={colors.ember} />
                  <Text style={[styles.doneText, { color: colors.ember }]}>Done Today</Text>
                </View>
              )}
            </View>

            <View style={styles.prescriptionBlock}>
              <Text style={[styles.prescriptionNumeral, { color: colors.bone }]}>{targetBpm}</Text>
              <View style={styles.prescriptionMeta}>
                <Text style={[styles.prescriptionUnit, { color: colors.ember }]}>breaths / min</Text>
                <Text style={[styles.prescriptionDuration, { color: colors.ash }]}>
                  {sessionMinutes} min daily discipline
                </Text>
              </View>
            </View>

            <Text style={[styles.techniqueLine, { color: colors.ash }]}>
              Technique: {displayTechniqueForStep(storedStep)}
            </Text>

            <Text style={[styles.goalTargetText, { color: colors.ash }]}>
              Goal:{' '}
              <Text style={{ color: colors.ember, fontWeight: '700' }}>
                Level {goalLevel} · {goalItem.name}
              </Text>
              {' '}— resting ≤{terminalBpm}/min{maintenance ? ', stilled.' : '.'}
            </Text>

            {!maintenance && storedStep < 3 && (
              <Text style={[styles.stepProgressText, { color: colors.ashMuted }]}>
                {SESSIONS_PER_STEP - stepSessions} of {SESSIONS_PER_STEP} sessions to go in this step
              </Text>
            )}
            {!maintenance && program?.advancedEarly && (
              <Text style={[styles.stepProgressText, { color: colors.ashMuted }]}>
                Pace moved ahead early on your latest check-in.
              </Text>
            )}
            {note && (
              <Text
                style={[
                  styles.programNote,
                  // Celebrations in ember, warnings in danger red.
                  { color: note.includes('unlocked.') ? colors.ember : colors.danger },
                ]}
              >
                {note}
              </Text>
            )}

            <View style={styles.ctaWrap}>
              <PrimaryButton
                label={todayDone ? 'Breathe Again' : 'Begin Daily Practice'}
                onPress={startSession}
                disabled={!program}
              />
            </View>
          </Card>

          {/* Visual Element: The 12-to-8 Angul Breath Caliper */}
          <AngulSpanGauge currentBpm={latestCheckin?.bpm} targetBpm={terminalBpm} />

          <OrnamentDivider />

          {/* Ancient Sanskrit Wisdom */}
          <Card style={styles.verseCard}>
            <Text style={[styles.verseSanskrit, { color: colors.ember }]}>{verse.sanskrit}</Text>
            <Text style={[styles.verseEnglish, { color: colors.bone }]}>{verse.english}</Text>
            <Text style={[styles.verseAttribution, { color: colors.ashMuted }]}>
              — After the Shiv Swarodaya (rendered in plain English)
            </Text>
          </Card>

          {/* Vitals & Practice Momentum */}
          <View style={styles.statsSection}>
            <SectionLabel>Practice Momentum</SectionLabel>
            <View style={styles.statsGrid}>
              <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.bone }]}>{stats?.totalSessions ?? 0}</Text>
                <Text style={[styles.statLabel, { color: colors.ash }]}>Sessions</Text>
              </Card>
              <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.bone }]}>{stats?.totalMinutes ?? 0}</Text>
                <Text style={[styles.statLabel, { color: colors.ash }]}>Mindful Min</Text>
              </Card>
              <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.bone }]}>{stats?.totalBreaths ?? 0}</Text>
                <Text style={[styles.statLabel, { color: colors.ash }]}>Breaths</Text>
              </Card>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  appTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 32,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    padding: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '700',
  },
  prescriptionBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  prescriptionNumeral: {
    fontFamily: fonts.serifSemi,
    fontSize: 64,
    lineHeight: 68,
  },
  prescriptionMeta: {
    justifyContent: 'center',
  },
  prescriptionUnit: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  prescriptionDuration: {
    fontSize: 13,
    marginTop: 2,
  },
  techniqueLine: {
    fontSize: 13,
    marginTop: 4,
  },
  goalTargetText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  programNote: {
    fontSize: 13,
    marginTop: spacing.xs,
  },
  stepProgressText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  ctaWrap: {
    marginTop: spacing.md,
  },
  verseCard: {
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  verseSanskrit: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  verseEnglish: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  verseAttribution: {
    fontSize: 11,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  statsSection: {
    marginTop: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statBox: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 22,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
  },
});

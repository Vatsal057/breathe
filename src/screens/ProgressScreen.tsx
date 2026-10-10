/**
 * Progress: Measurements, Goal Calibration, History, and Appearance Settings.
 * Includes WatermarkNumeral, OrnamentDivider, and live Theme Mode Switcher.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, radii, spacing, useTheme, type ThemeMode } from '../theme';
import {
  Badge,
  Card,
  EmberToggle,
  PrimaryButton,
  Screen,
  ScreenTitle,
  SecondaryButton,
  SectionLabel,
} from '../components/ui';
import { BloomStamp } from '../components/icons';
import { AspirationSelector } from '../components/AspirationSelector';
import { ANGUL_BEYOND } from '../data/angul';
import { WatermarkNumeral } from '../components/WatermarkNumeral';
import { OrnamentDivider } from '../components/OrnamentDivider';
import { terminalBpmForGoal } from '../data/program';
import { BREATH_LEVELS, levelForBpm } from '../data/levels';
import type { RootStackParamList } from '../navigation/types';
import {
  controlPauseBand,
  deleteSession,
  loadCheckins,
  loadControlPauses,
  loadSettings,
  loadStats,
  logCheckin,
  resetProgress,
  saveSettings,
  type ControlPause,
  type RestingCheckin,
  type Stats,
} from '../storage/stats';
import {
  cancelDailyReminder,
  requestReminderPermission,
  scheduleDailyReminder,
} from '../notifications/reminders';

function formatDay(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const MIN_BPM = 4;
const MAX_BPM = 30;
const GOAL_LEVELS = [1, 2, 3, 4] as const;
const COUNT_SECONDS = 60;
const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Ivory' },
  { mode: 'dark', label: 'Nocturnal' },
  { mode: 'system', label: 'System' },
];

type CheckinPhase = 'idle' | 'counting' | 'entering';

export function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, themeMode, setThemeMode } = useTheme();

  const [stats, setStats] = useState<Stats | null>(null);
  const [checkins, setCheckins] = useState<RestingCheckin[]>([]);
  const [pauses, setPauses] = useState<ControlPause[]>([]);
  const [goalLevel, setGoalLevel] = useState<1 | 2 | 3 | 4>(4);
  const [aspiration, setAspiration] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [permNote, setPermNote] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  // 60-second guided resting rate check-in
  const [checkinPhase, setCheckinPhase] = useState<CheckinPhase>('idle');
  const [countLeft, setCountLeft] = useState(COUNT_SECONDS);
  const [draftBpm, setDraftBpm] = useState(12);
  const [logging, setLogging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [s, c, p, settings] = await Promise.all([
          loadStats(),
          loadCheckins(),
          loadControlPauses(),
          loadSettings(),
        ]);
        if (!alive) return;
        setStats(s);
        setCheckins(c);
        setPauses(p);
        setGoalLevel(settings.goalLevel ?? 4);
        setAspiration(settings.aspirationLevel ?? null);
        setSoundOn(settings.soundOn);
        setReminderOn(settings.reminderOn);
        setReminderHour(settings.reminderHour);
        setReminderMinute(settings.reminderMinute);
        setStreakDays(s.streakDays);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  useEffect(() => {
    if (checkinPhase !== 'counting') return;
    const started = Date.now();
    timerRef.current = setInterval(() => {
      const left = COUNT_SECONDS - Math.floor((Date.now() - started) / 1000);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setCheckinPhase('entering');
      } else {
        setCountLeft(left);
      }
    }, 250);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkinPhase]);

  const doLogCheckin = async () => {
    if (logging) return;
    setLogging(true);
    try {
      const next = await logCheckin(draftBpm);
      setCheckins(next);
      setCheckinPhase('idle');
    } finally {
      setLogging(false);
    }
  };

  const changeGoal = async (level: 1 | 2 | 3 | 4) => {
    setGoalLevel(level);
    await saveSettings({ goalLevel: level });
  };

  const changeAspiration = async (level: number | null) => {
    setAspiration(level);
    await saveSettings({ aspirationLevel: level });
  };

  const confirmDeleteSession = (id: string) => {
    Alert.alert(
      'Remove this session?',
      'Its minutes, breaths, and streak credit will be recalculated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void deleteSession(id).then((st) => {
              setStats(st);
              setStreakDays(st.streakDays);
            });
          },
        },
      ],
    );
  };

  const confirmReset = () => {
    Alert.alert(
      'Start over?',
      'This clears all sessions, check-ins, control pauses, achievements, and program progress. Your goal, aspiration, reminder, and theme stay.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start over',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const s2 = await resetProgress();
              const [st, ci, pa] = await Promise.all([
                loadStats(),
                loadCheckins(),
                loadControlPauses(),
              ]);
              setStats(st);
              setCheckins(ci);
              setPauses(pa);
              setStreakDays(st.streakDays);
              setGoalLevel(s2.goalLevel ?? 4);
              setAspiration(s2.aspirationLevel ?? null);
            })();
          },
        },
      ],
    );
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    await saveSettings({ soundOn: next });
  };

  const toggleReminder = async () => {
    if (reminderOn) {
      await cancelDailyReminder();
      setReminderOn(false);
      setPermNote(false);
      await saveSettings({ reminderOn: false });
      return;
    }
    const granted = await requestReminderPermission();
    if (!granted) {
      setPermNote(true);
      return;
    }
    await scheduleDailyReminder(reminderHour, reminderMinute, streakDays);
    setReminderOn(true);
    setPermNote(false);
    await saveSettings({ reminderOn: true, reminderHour, reminderMinute });
  };

  const cycleHour = async (delta: number) => {
    const nextHour = (reminderHour + delta + 24) % 24;
    setReminderHour(nextHour);
    if (reminderOn) {
      await scheduleDailyReminder(nextHour, reminderMinute, streakDays);
    }
    await saveSettings({ reminderHour: nextHour });
  };

  const cycleMinute = async (delta: number) => {
    const nextMin = (reminderMinute + delta + 60) % 60;
    setReminderMinute(nextMin);
    if (reminderOn) {
      await scheduleDailyReminder(reminderHour, nextMin, streakDays);
    }
    await saveSettings({ reminderMinute: nextMin });
  };

  const terminal = terminalBpmForGoal(goalLevel);
  const latestCheckin = checkins[0] ?? null;
  const currentMilestone = levelForBpm(latestCheckin?.bpm ?? null);
  const goalItem = BREATH_LEVELS[goalLevel - 1] ?? BREATH_LEVELS[3];
  const aspirationEntry = ANGUL_BEYOND.find((a) => a.level === aspiration) ?? null;

  const hour12 = reminderHour % 12 === 0 ? 12 : reminderHour % 12;
  const ampm = reminderHour >= 12 ? 'PM' : 'AM';
  const minLabel = `${reminderMinute}`.padStart(2, '0');

  return (
    <Screen noPaddingBottom>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenTitle subtitle="Calibration, biometric check-ins & vitals">
          Progress & Depth
        </ScreenTitle>

        {/* 1. Destination Goal Setting */}
        <View style={styles.sectionWrap}>
          <SectionLabel gold>Chosen Destination</SectionLabel>
          <Card highlight style={styles.goalCard}>
            <View style={styles.goalHeaderRow}>
              <View>
                <Text style={[styles.goalTitle, { color: colors.bone }]}>
                  Level {goalLevel} · {goalItem.name} ({goalItem.sanskrit})
                </Text>
                <Text style={[styles.goalSub, { color: colors.ash }]}>
                  Target: Resting ≤{terminal} breaths / minute comfortably
                </Text>
              </View>
              <Badge label={`≤${terminal} BPM`} variant="coral" />
            </View>

            <View style={styles.goalPicker}>
              {GOAL_LEVELS.map((lvl) => {
                const active = goalLevel === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => void changeGoal(lvl)}
                    style={[
                      styles.goalPill,
                      {
                        backgroundColor: active ? colors.emberDim : colors.surfaceSubtle,
                        borderColor: active ? colors.ember : colors.hairline,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.goalPillText,
                        { color: active ? colors.ember : colors.ash },
                      ]}
                    >
                      Level {lvl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
          <Text style={[styles.tradNote, { color: colors.ashMuted }]}>
            Level names and fruits come from the old text. We measure only your breath rate.
          </Text>
          {aspiration != null && aspirationEntry && (
            <Text style={[styles.aspirationLine, { color: colors.ash }]}>
              Aspiration: Level {aspiration} · {aspirationEntry.hindi} — a traditional horizon, not a measured target.
            </Text>
          )}
          <View style={styles.aspirationWrap}>
            <AspirationSelector value={aspiration} onChange={changeAspiration} />
          </View>
        </View>

        {/* 2. 60-Second Guided Resting Rate Check-in with WatermarkNumeral */}
        <View style={styles.sectionWrap}>
          <SectionLabel>Resting Breath Rate (BPM)</SectionLabel>
          <Card style={styles.checkinCard}>
            {/* Ambient Watermark numeral behind the check-in section */}
            <WatermarkNumeral
              value={`${terminal}`}
              size={130}
              style={styles.checkinWatermark}
            />

            {checkinPhase === 'idle' && (
              <>
                <View style={styles.checkinTopRow}>
                  <View>
                    <Text style={[styles.checkinCurrentValue, { color: colors.bone }]}>
                      {latestCheckin ? `${latestCheckin.bpm}` : '—'}{' '}
                      <Text style={[styles.checkinUnit, { color: colors.ember }]}>BPM</Text>
                    </Text>
                    <Text style={[styles.checkinSub, { color: colors.ash }]}>
                      {latestCheckin
                        ? `Last checked ${formatDay(latestCheckin.dayKey)} · ${currentMilestone ? currentMilestone.name : 'Normal'}`
                        : 'No check-ins logged yet'}
                    </Text>
                  </View>
                  {currentMilestone && (
                    <Badge label={currentMilestone.sanskrit} variant="coral" />
                  )}
                </View>

                <View style={styles.checkinActionWrap}>
                  <PrimaryButton
                    label="Begin 60-Second Count"
                    onPress={() => {
                      setCountLeft(COUNT_SECONDS);
                      setCheckinPhase('counting');
                    }}
                  />
                </View>
              </>
            )}

            {checkinPhase === 'counting' && (
              <View style={styles.countingBox}>
                <Text style={[styles.countNumeral, { color: colors.ember }]}>{countLeft}s</Text>
                <Text style={[styles.countInstruction, { color: colors.bone }]}>
                  Sit still. Breathe naturally through nose. Count every inhale.
                </Text>
                <Pressable
                  onPress={() => setCheckinPhase('idle')}
                  style={styles.cancelCount}
                >
                  <Text style={[styles.cancelCountText, { color: colors.ash }]}>Cancel</Text>
                </Pressable>
              </View>
            )}

            {checkinPhase === 'entering' && (
              <View style={styles.enteringBox}>
                <Text style={[styles.enteringTitle, { color: colors.bone }]}>How many breaths did you count?</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => setDraftBpm((b) => Math.max(MIN_BPM, b - 1))}
                    style={[styles.stepperBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.hairline }]}
                  >
                    <Text style={[styles.stepperBtnText, { color: colors.bone }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.stepperDisplay, { color: colors.ember }]}>{draftBpm} bpm</Text>
                  <Pressable
                    onPress={() => setDraftBpm((b) => Math.min(MAX_BPM, b + 1))}
                    style={[styles.stepperBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.hairline }]}
                  >
                    <Text style={[styles.stepperBtnText, { color: colors.bone }]}>+</Text>
                  </Pressable>
                </View>

                <PrimaryButton
                  label={logging ? 'Saving…' : 'Record Resting Rate'}
                  onPress={doLogCheckin}
                  disabled={logging}
                />
              </View>
            )}

            {checkins.length > 1 && (
              <View style={styles.recentTrend}>
                <Text style={[styles.recentTrendLabel, { color: colors.ashMuted }]}>Recent: </Text>
                <Text style={[styles.recentTrendValues, { color: colors.ash }]}>
                  {checkins.slice(0, 5).map((c) => `${c.bpm}`).join(' · ')} bpm
                </Text>
              </View>
            )}
            {stats && stats.history.length > 0 && (
              <View style={[styles.calmTrend, { borderTopColor: colors.hairline }]}>
                <Text style={[styles.calmTrendLabel, { color: colors.ashMuted }]}>
                  Calm after sessions
                </Text>
                <View style={styles.calmDots}>
                  {stats.history.slice(0, 7).reverse().map((h) => (
                    <View
                      key={h.id}
                      style={[
                        styles.calmDot,
                        { borderColor: colors.hairline },
                        h.calm != null
                          ? { backgroundColor: colors.ember, opacity: 0.3 + (h.calm / 5) * 0.7 }
                          : { backgroundColor: 'transparent' },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}
          </Card>
        </View>

        <OrnamentDivider />

        {/* 3. CO2 Tolerance / Control Pause */}
        <View style={styles.sectionWrap}>
          <SectionLabel>CO₂ Tolerance · Control Pause</SectionLabel>
          <Card style={styles.pauseCard}>
            <View style={styles.pauseTopRow}>
              <View>
                <Text style={[styles.pauseTime, { color: colors.bone }]}>
                  {pauses[0] ? `${pauses[0].seconds}s` : '—'}
                </Text>
                <Text style={[styles.pauseBand, { color: colors.ember }]}>
                  {pauses[0] ? controlPauseBand(pauses[0].seconds).range : 'Breath hold after gentle exhale'}
                </Text>
              </View>
              <SecondaryButton
                label="Measure Now"
                onPress={() => navigation.navigate('Measure')}
                style={styles.measureBtn}
              />
            </View>
            <Text style={[styles.pauseExplainer, { color: colors.ash }]}>
              Hold after an exhale until the first urge to breathe. As CO₂ tolerance climbs,
              the body tends to release oxygen more readily (the Bohr effect).
            </Text>
          </Card>
        </View>

        {/* 4. Settings: Guiding Hum, Daily Reminder & Appearance Theme Switcher */}
        <View style={styles.sectionWrap}>
          <SectionLabel>Settings & Appearance</SectionLabel>
          <Card style={styles.settingsCard}>
            {/* Appearance Theme Selector */}
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.bone }]}>Theme Appearance</Text>
                <Text style={[styles.settingSub, { color: colors.ash }]}>
                  Warm Ivory (Light) or Nocturnal (Dark)
                </Text>
              </View>
            </View>
            <View style={styles.themeSelectorRow}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = themeMode === opt.mode;
                return (
                  <Pressable
                    key={opt.mode}
                    onPress={() => void setThemeMode(opt.mode)}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: isSelected ? colors.emberDim : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.ember : colors.hairline,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.themePillText,
                        { color: isSelected ? colors.ember : colors.ash },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.settingRow, { borderTopColor: colors.hairline, borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.bone }]}>Guiding Om Chant</Text>
                <Text style={[styles.settingSub, { color: colors.ash }]}>
                  A real Om voice breathes with you, one chant per breath
                </Text>
                <Text style={[styles.settingSub, { color: colors.ash }]}>
                  Voice: CarlosCarty, CC-BY 4.0
                </Text>
              </View>
              <EmberToggle value={soundOn} onPress={toggleSound} />
            </View>

            <View style={[styles.settingRow, { borderTopColor: colors.hairline, borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.bone }]}>Daily Practice Reminder</Text>
                <Text style={[styles.settingSub, { color: colors.ash }]}>One quiet chime at your chosen time</Text>
              </View>
              <EmberToggle value={reminderOn} onPress={toggleReminder} />
            </View>

            <View style={[styles.settingRow, { borderTopColor: colors.hairline, borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.bone }]}>Start over</Text>
                <Text style={[styles.settingSub, { color: colors.ash }]}>
                  Clears sessions, check-ins, and achievements. Keeps your goal and theme.
                </Text>
              </View>
              <Pressable
                onPress={confirmReset}
                hitSlop={8}
                style={[styles.resetBtn, { borderColor: colors.danger }]}
              >
                <Text style={[styles.resetBtnText, { color: colors.danger }]}>Reset</Text>
              </Pressable>
            </View>

            {reminderOn && (
              <View style={[styles.timePickerRow, { borderTopColor: colors.hairline }]}>
                <Text style={[styles.timePickerLabel, { color: colors.ash }]}>Reminder Time</Text>
                <View style={styles.timeControlGroup}>
                  <Pressable onPress={() => void cycleHour(-1)} style={[styles.timeStepperBtn, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.timeStepperText, { color: colors.bone }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.timeValText, { color: colors.ember }]}>{hour12}</Text>
                  <Pressable onPress={() => void cycleHour(1)} style={[styles.timeStepperBtn, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.timeStepperText, { color: colors.bone }]}>+</Text>
                  </Pressable>

                  <Text style={[styles.timeColon, { color: colors.ash }]}>:</Text>

                  <Pressable onPress={() => void cycleMinute(-5)} style={[styles.timeStepperBtn, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.timeStepperText, { color: colors.bone }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.timeValText, { color: colors.ember }]}>{minLabel}</Text>
                  <Pressable onPress={() => void cycleMinute(5)} style={[styles.timeStepperBtn, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.timeStepperText, { color: colors.bone }]}>+</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void cycleHour(12)}
                    style={[styles.ampmBadge, { backgroundColor: colors.surfaceSubtle }]}
                  >
                    <Text style={[styles.ampmText, { color: colors.bone }]}>{ampm}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Card>
          {permNote && (
            <Text style={[styles.permWarning, { color: colors.danger }]}>
              Notifications are disabled in system settings. Enable them to receive reminders.
            </Text>
          )}
        </View>

        {/* 5. Session History */}
        <View style={styles.sectionWrap}>
          <SectionLabel>Recent Practice Sessions</SectionLabel>
          {stats && stats.history.length > 0 ? (
            <Card style={styles.historyCard}>
              {stats.history.slice(0, 5).map((h, i) => (
                <View
                  key={h.id}
                  style={[styles.historyRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.hairline }]}
                >
                  <View style={[styles.historyIcon, { backgroundColor: colors.surfaceSubtle }]}>
                    <BloomStamp size={18} color={colors.ember} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyTitle, { color: colors.bone }]}>{formatDay(h.dayKey)}</Text>
                    <Text style={[styles.historySub, { color: colors.ash }]}>
                      {h.minutes} min · {h.breaths} breaths
                      {h.calm != null ? ` · Calm: ${h.calm}/5` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmDeleteSession(h.id)} hitSlop={8}>
                    <Text style={[styles.historyDeleteText, { color: colors.danger }]}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.ash }]}>No sessions recorded yet.</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  sectionWrap: {
    marginTop: spacing.md,
  },
  goalCard: {
    padding: spacing.md,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  goalTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 17,
  },
  goalSub: {
    fontSize: 13,
    marginTop: 2,
  },
  goalPicker: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  goalPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  goalPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  aspirationLine: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  tradNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  aspirationWrap: {
    marginTop: spacing.xs,
  },
  checkinCard: {
    padding: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  checkinWatermark: {
    right: -10,
    top: -15,
  },
  checkinTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  checkinCurrentValue: {
    fontFamily: fonts.serifSemi,
    fontSize: 44,
    lineHeight: 48,
  },
  checkinUnit: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkinSub: {
    fontSize: 13,
    marginTop: 4,
  },
  checkinActionWrap: {
    marginTop: spacing.md,
  },
  countingBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  countNumeral: {
    fontFamily: fonts.serifSemi,
    fontSize: 72,
    lineHeight: 76,
  },
  countInstruction: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 240,
  },
  cancelCount: {
    marginTop: spacing.md,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cancelCountText: {
    fontSize: 13,
  },
  enteringBox: {
    paddingVertical: spacing.xs,
  },
  enteringTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 24,
    fontWeight: '300',
  },
  stepperDisplay: {
    fontFamily: fonts.serifSemi,
    fontSize: 28,
    minWidth: 120,
    textAlign: 'center',
  },
  recentTrend: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  recentTrendLabel: {
    fontSize: 12,
  },
  recentTrendValues: {
    fontSize: 12,
    fontWeight: '600',
  },
  calmTrend: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  calmTrendLabel: {
    fontSize: 12,
  },
  calmDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  calmDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  pauseCard: {
    padding: spacing.md,
  },
  pauseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseTime: {
    fontFamily: fonts.serifSemi,
    fontSize: 36,
  },
  pauseBand: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  measureBtn: {
    minHeight: 40,
    paddingHorizontal: 16,
  },
  pauseExplainer: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  settingsCard: {
    padding: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  themePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  themePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyDeleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timePickerRow: {
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
  },
  timeControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeStepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeStepperText: {
    fontSize: 18,
  },
  timeValText: {
    fontFamily: fonts.serifSemi,
    fontSize: 18,
    minWidth: 26,
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  ampmBadge: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  ampmText: {
    fontSize: 12,
    fontWeight: '700',
  },
  permWarning: {
    fontSize: 12,
    marginTop: 6,
  },
  historyCard: {
    padding: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  historySub: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});

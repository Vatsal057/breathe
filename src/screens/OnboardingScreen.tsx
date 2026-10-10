/**
 * First-launch Onboarding: 5 short pages, one idea each.
 * What this is, what changes, how the program works,
 * pick your depth, today's practice. Plain words throughout.
 * The same pages live on the Learn tab to revisit anytime.
 */
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, spacing, useTheme } from '../theme';
import { Badge, Card, PrimaryButton, SecondaryButton } from '../components/ui';
import { BloomStamp } from '../components/icons';
import { BackdropBloom } from '../components/BackdropBloom';
import { AspirationSelector } from '../components/AspirationSelector';
import { BREATH_LEVELS } from '../data/levels';
import { dayKeyOf, saveOnboardingDone, saveSettings } from '../storage/stats';

type Step = 'breath' | 'changes' | 'program' | 'destination' | 'practice';

const STEPS: Step[] = ['breath', 'changes', 'program', 'destination', 'practice'];

const STEP_LABEL: Record<Step, string> = {
  breath: 'STEP 1 OF 5',
  changes: 'STEP 2 OF 5',
  program: 'STEP 3 OF 5',
  destination: 'STEP 4 OF 5',
  practice: 'STEP 5 OF 5',
};

function Point({ bold, children }: { bold: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.pointRow}>
      <View style={[styles.pointDot, { backgroundColor: colors.ember }]} />
      <Text style={[styles.pointText, { color: colors.ash }]}>
        <Text style={[styles.pointBold, { color: colors.bone }]}>{bold} </Text>
        {children}
      </Text>
    </View>
  );
}

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('breath');
  const [goalLevel, setGoalLevel] = useState<1 | 2 | 3 | 4>(4);
  const [aspiration, setAspiration] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      await saveSettings({
        goalLevel,
        programStartDay: dayKeyOf(new Date()),
        aspirationLevel: aspiration,
      });
      await saveOnboardingDone();
    } finally {
      onDone();
    }
  };

  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)]);
  const back = () => setStep(STEPS[Math.max(0, stepIndex - 1)]);

  return (
    <View style={[styles.root, { backgroundColor: colors.ink, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BackdropBloom size={500} offsetY={-20} />

      <View style={styles.content}>
        <View style={styles.topIndicator}>
          <Text style={[styles.stepNum, { color: colors.ember }]}>{STEP_LABEL[step]}</Text>
          <View style={[styles.stepBar, { backgroundColor: colors.hairline }]}>
            <View
              style={[
                styles.stepFill,
                {
                  backgroundColor: colors.ember,
                  width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {step === 'breath' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <View style={styles.stampHeader}>
              <BloomStamp size={48} color={colors.ember} />
            </View>
            <Text style={[styles.title, { color: colors.bone }]}>Your breath travels</Text>
            <Text style={[styles.subtitle, { color: colors.ash }]}>
              One old idea, plainly put.
            </Text>

            <Card highlight style={styles.wisdomCard}>
              <Text style={[styles.wisdomVerse, { color: colors.ember }]}>
                An old text measured the exhale at 12 finger-widths. The less breath you spend, the more stays with you.
              </Text>
            </Card>

            <Text style={[styles.plainLine, { color: colors.ash }]}>
              This app trains the exhale to grow shorter and quieter, one slow session at a time.
            </Text>
          </ScrollView>
        )}

        {step === 'changes' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <Text style={[styles.title, { color: colors.bone }]}>What actually changes</Text>
            <Text style={[styles.subtitle, { color: colors.ash }]}>
              Honest outcomes only.
            </Text>

            <View style={styles.pointList}>
              <Point bold="Calmer evenings.">Often noticeable within the first two weeks of daily practice.</Point>
              <Point bold="A slower resting breath.">With daily practice it often drops around week six to eight — yours may differ.</Point>
              <Point bold="Steadier speech.">Slow breathing steadies the voice and the pace of words.</Point>
            </View>

            <Card style={styles.noteCard}>
              <Text style={[styles.noteText, { color: colors.ash }]}>
                The old text promises powers at each stage. We track what can be measured: your resting breath rate. Nothing else is promised.
              </Text>
            </Card>
          </ScrollView>
        )}

        {step === 'program' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <Text style={[styles.title, { color: colors.bone }]}>How the program works</Text>
            <Text style={[styles.subtitle, { color: colors.ash }]}>
              The whole contract, in four lines.
            </Text>

            <View style={styles.pointList}>
              <Point bold="One session a day.">About 10 minutes. A second session is optional.</Point>
              <Point bold="The app sets the pace.">7 sessions per step. The pace slows as you go; new techniques unlock along the way.</Point>
              <Point bold="New techniques unlock.">Ujjayi, nadi shodhana and kumbhaka open up as you advance.</Point>
              <Point bold="Breaks are forgiven.">Miss a week and the program eases back instead of punishing you.</Point>
            </View>
          </ScrollView>
        )}

        {step === 'destination' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <Text style={[styles.title, { color: colors.bone }]}>Pick your depth</Text>
            <Text style={[styles.subtitle, { color: colors.ash }]}>
              How far do you want to take the practice? You can change this later.
            </Text>

            <View style={styles.goalList}>
              {BREATH_LEVELS.map((item) => {
                const active = goalLevel === item.level;
                return (
                  <Pressable
                    key={item.level}
                    onPress={() => setGoalLevel(item.level as 1 | 2 | 3 | 4)}
                  >
                    <Card
                      style={[
                        styles.goalChoiceCard,
                        active && {
                          borderColor: colors.ember,
                          backgroundColor: colors.surfaceSubtle,
                        },
                      ]}
                    >
                      <View style={styles.goalChoiceHeader}>
                        <View style={styles.goalChoiceTitleWrap}>
                          <Text style={[styles.goalChoiceNum, { color: active ? colors.ember : colors.ash }]}>
                            Level {item.level}
                          </Text>
                          <Text style={[styles.goalChoiceName, { color: colors.bone }]}>
                            {item.name} · {item.sanskrit}
                          </Text>
                        </View>
                        <Badge
                          label={`≤${item.maxBpm} BPM`}
                          variant={active ? 'coral' : 'default'}
                        />
                      </View>
                      <Text style={[styles.goalChoiceFruit, { color: colors.ember }]}>{item.fruit}</Text>
                      <Text style={[styles.goalChoiceMeaning, { color: colors.ash }]}>{item.meaning}</Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.tradNote, { color: colors.ashMuted }]}>
              Level names and fruits come from the old text. We measure only your breath rate.
            </Text>
            <AspirationSelector value={aspiration} onChange={setAspiration} />
          </ScrollView>
        )}

        {step === 'practice' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <View style={styles.stampHeader}>
              <BloomStamp size={54} color={colors.ember} />
            </View>
            <Text style={[styles.title, { color: colors.bone }]}>Today&apos;s practice</Text>
            <Text style={[styles.subtitle, { color: colors.ash }]}>
              One session a day. Sit straight, close eyes, follow the bloom.
            </Text>

            <Card style={styles.protocolCard}>
              <View style={styles.protocolRow}>
                <Text style={[styles.protocolNum, { color: colors.ember }]}>10</Text>
                <View style={styles.protocolMeta}>
                  <Text style={[styles.protocolTitle, { color: colors.bone }]}>Minutes Daily</Text>
                  <Text style={[styles.protocolSub, { color: colors.ash }]}>
                    Slow nasal breathing at the app&apos;s pace
                  </Text>
                </View>
              </View>

              <View style={[styles.protocolRow, { borderTopWidth: 1, borderTopColor: colors.hairline, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
                <Text style={[styles.protocolNum, { color: colors.ember }]}>1</Text>
                <View style={styles.protocolMeta}>
                  <Text style={[styles.protocolTitle, { color: colors.bone }]}>Silent Nasal Breath</Text>
                  <Text style={[styles.protocolSub, { color: colors.ash }]}>
                    Mouth closed, smooth subtle exhale
                  </Text>
                </View>
              </View>
            </Card>

            <Text style={[styles.safetyLine, { color: colors.ashMuted }]}>
              Stop if you feel dizzy. Never hold the breath in water or while driving.
            </Text>
          </ScrollView>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.hairline, backgroundColor: colors.ink }]}>
        {step === 'practice' ? (
          <PrimaryButton
            label={finishing ? 'Entering…' : 'Begin My Practice'}
            onPress={finish}
            disabled={finishing}
          />
        ) : (
          <View style={styles.footerNav}>
            {stepIndex > 0 && <SecondaryButton label="Back" onPress={back} />}
            <View style={styles.footerContinue}>
              <PrimaryButton label="Continue" onPress={next} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  topIndicator: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  stepBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepFill: {
    height: '100%',
  },
  scrollInner: {
    paddingBottom: spacing.lg,
  },
  stampHeader: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  title: {
    fontFamily: fonts.serifSemi,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  wisdomCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  wisdomVerse: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  plainLine: {
    fontSize: 14,
    lineHeight: 21,
  },
  noteCard: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
  },
  pointList: {
    gap: spacing.sm,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  pointBold: {
    fontWeight: '700',
  },
  goalList: {
    gap: spacing.sm,
  },
  goalChoiceCard: {
    padding: spacing.md,
  },
  goalChoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalChoiceTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalChoiceNum: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalChoiceName: {
    fontFamily: fonts.serifSemi,
    fontSize: 16,
  },
  goalChoiceFruit: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  goalChoiceMeaning: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  tradNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  protocolCard: {
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  protocolNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 40,
    minWidth: 46,
  },
  protocolMeta: {
    flex: 1,
  },
  protocolTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  protocolSub: {
    fontSize: 13,
    marginTop: 2,
  },
  safetyLine: {
    fontSize: 13,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
  footerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerContinue: {
    flex: 1,
  },
});

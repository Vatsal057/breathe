/**
 * Guided Control-Pause measurement (CO2 tolerance).
 * Hold after a gentle exhale until the FIRST urge to breathe.
 * Dual-theme (Light & Dark) adaptive.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, spacing, useTheme } from '../theme';
import { Badge, Card, PrimaryButton, Screen, ScreenTitle, SectionLabel } from '../components/ui';
import { controlPauseBand, logControlPause, unlockAchievements } from '../storage/stats';
import { controlPauseAchievements } from '../data/achievements';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Phase = 'intro' | 'measuring' | 'done';

const INSTRUCTIONS = [
  'Sit calmly and breathe naturally through your nose for a minute.',
  'After a normal, relaxed exhale, gently let the breath stop.',
  'Hold until the FIRST clear urge to breathe (never force or gasp).',
];

export function MeasureScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [phase, setPhase] = useState<Phase>('intro');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [resultSec, setResultSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (phase !== 'measuring') return;
    startRef.current = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - startRef.current), 100);
    return () => clearInterval(id);
  }, [phase]);

  const stopMeasure = () => {
    const seconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    setResultSec(seconds);
    setPhase('done');
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const pauses = await logControlPause(resultSec);
      await unlockAchievements(controlPauseAchievements(pauses));
    } finally {
      setSaving(false);
      navigation.goBack();
    }
  };

  const band = controlPauseBand(resultSec);

  return (
    <View style={[styles.root, { backgroundColor: colors.ink }]}>
      <Screen noPaddingBottom>
        <ScreenTitle subtitle="CO₂ Tolerance & Vagal Baseline">
          Control Pause
        </ScreenTitle>

        {phase === 'intro' && (
          <View style={styles.contentWrap}>
            <Text style={[styles.lede, { color: colors.ash }]}>
              The duration you can comfortably hold after a relaxed exhale before the first urge to inhale.
              Directly reflects carbon dioxide tolerance and physiological oxygen delivery.
            </Text>

            <View style={styles.section}>
              <SectionLabel gold>How to Measure</SectionLabel>
              <Card style={styles.instructionCard}>
                {INSTRUCTIONS.map((line, i) => (
                  <View
                    key={line}
                    style={[
                      styles.instructionRow,
                      i > 0 && { borderTopWidth: 1, borderTopColor: colors.hairline, marginTop: spacing.xs, paddingTop: spacing.xs },
                    ]}
                  >
                    <Text style={[styles.stepNum, { color: colors.ember }]}>{i + 1}</Text>
                    <Text style={[styles.instructionText, { color: colors.bone }]}>{line}</Text>
                  </View>
                ))}
              </Card>
            </View>

            <Text style={[styles.safety, { color: colors.ashMuted }]}>
              Stop immediately at the first natural urge. Never hold to gasping or dizziness.
            </Text>
          </View>
        )}

        {phase === 'measuring' && (
          <View style={styles.measureWrap}>
            <Text style={[styles.numeral, { color: colors.ember }]}>{Math.floor(elapsedMs / 1000)}s</Text>
            <Text style={[styles.measureHint, { color: colors.bone }]}>Holding breath after exhale</Text>
            <Text style={[styles.subHint, { color: colors.ash }]}>Tap below the moment you feel the first urge</Text>
          </View>
        )}

        {phase === 'done' && (
          <View style={styles.resultWrap}>
            <Card highlight style={styles.resultCard}>
              <Text style={[styles.resultNumeral, { color: colors.ember }]}>{resultSec}s</Text>
              <Badge label={band.range} variant="coral" />
              <Text style={[styles.resultBandDetail, { color: colors.ash }]}>
                Steady baseline. Notice this climb as your weeks of practice accumulate.
              </Text>
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
        {phase === 'intro' && (
          <PrimaryButton label="Begin Hold Test" onPress={() => setPhase('measuring')} />
        )}
        {phase === 'measuring' && (
          <PrimaryButton label="I Feel The First Urge" onPress={stopMeasure} />
        )}
        {phase === 'done' && (
          <PrimaryButton
            label={saving ? 'Saving Result…' : 'Save & Return'}
            onPress={save}
            disabled={saving}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentWrap: {
    marginTop: spacing.sm,
  },
  lede: {
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    marginTop: spacing.md,
  },
  instructionCard: {
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: spacing.xs,
  },
  stepNum: {
    fontFamily: fonts.serifSemi,
    fontSize: 16,
    minWidth: 18,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  safety: {
    fontSize: 13,
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  measureWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeral: {
    fontFamily: fonts.serifSemi,
    fontSize: 88,
    lineHeight: 96,
  },
  measureHint: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  subHint: {
    fontSize: 13,
    marginTop: 4,
  },
  resultWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  resultCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultNumeral: {
    fontFamily: fonts.serifSemi,
    fontSize: 72,
    lineHeight: 78,
  },
  resultBandDetail: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});

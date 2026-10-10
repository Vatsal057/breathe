import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { fonts, spacing, useTheme } from '../theme';
import { Bloom, GrainOverlay } from '../components/Bloom';
import { PauseIcon, PlayIcon } from '../components/icons';
import { EmberToggle, PrimaryButton } from '../components/ui';
import { useBreathEngine } from '../engine/useBreathEngine';
import { buildKumbhakaPreset, buildNadiPreset, buildProgramPreset, presetDisplayName, type PhaseKey, type SessionDuration } from '../data/presets';
import { hum } from '../audio/hum';
import { loadSettings } from '../storage/stats';
import type { RootStackParamList, SessionTechniqueId } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Session'>;

const PHASE_LABEL: Record<PhaseKey, string> = {
  inhale: 'Inhale Prana',
  holdIn: 'Hold in Stillness',
  exhale: 'Exhale & Release',
  holdOut: 'Hold in Void',
};

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${`${s}`.padStart(2, '0')}`;
}

export function SessionScreen() {
  useKeepAwake();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);

  const config = route.params;
  const minutes = config.minutes > 0 ? config.minutes : 10;
  const techniqueId: SessionTechniqueId = config.techniqueId ?? 'pacer';
  const preset = useMemo(() => {
    if (techniqueId === 'nadi') return buildNadiPreset(config.targetBpm);
    if (techniqueId === 'kumbhaka') return buildKumbhakaPreset(config.targetBpm, 4);
    return buildProgramPreset(config.targetBpm);
  }, [config.targetBpm, techniqueId]);
  const isNadi = techniqueId === 'nadi';
  const isKumbhaka = techniqueId === 'kumbhaka';
  const ujjayiUnlocked = config.step >= 1;
  // Session-local by design: the cue resets to on at the start of each session.
  const [ujjayiOn, setUjjayiOn] = useState(ujjayiUnlocked);
  const duration = useMemo<SessionDuration>(
    () => ({ mode: 'minutes', minutes }),
    [minutes],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      await hum.ensure();
      const settings = await loadSettings();
      const rm = await AccessibilityInfo.isReduceMotionEnabled();
      if (alive) {
        hum.setEnabled(settings.soundOn);
        setReducedMotion(rm);
      }
    })();
    return () => {
      alive = false;
      hum.dispose();
    };
  }, []);

  const { snapshot, start, pause, resume, cancel } = useBreathEngine(
    preset,
    duration,
    { ramp: false, settleSec: 3 },
    {
      onPhaseChange: () => {
        try {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
          // Haptics optional
        }
      },
      onComplete: (breaths, elapsedSec) => {
        navigation.replace('Complete', {
          targetBpm: config.targetBpm,
          step: config.step,
          minutes,
          breaths,
          elapsedSec,
          techniqueId,
          // The practiced pace, not the program target (kumbhaka's hold
          // makes the real pace slower than the target).
          actualBpm: preset.breathsPerMinute,
        });
      },
    },
  );

  const statusRef = useRef(snapshot.status);
  useEffect(() => {
    statusRef.current = snapshot.status;
  }, [snapshot.status]);

  const cycleSec = useMemo(
    () => preset.phases.reduce((a, p) => a + p.seconds, 0),
    [preset],
  );

  useEffect(() => {
    if (snapshot.status === 'running') {
      hum.begin(cycleSec);
      hum.phaseChanged(snapshot.phase.key, snapshot.phaseSecondsEff);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.phaseToken]);

  const prevStatusRef = useRef(snapshot.status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    const s = snapshot.status;
    if (s === 'settle') hum.begin(cycleSec);
    else if (s === 'paused') hum.onPause();
    else if (s === 'running' && prev === 'paused') hum.onResume();
    else if (s === 'running') hum.begin(cycleSec); // settle -> running: make sure the drone is up
    else if (s === 'done' || s === 'idle') hum.end();
    prevStatusRef.current = s;
  }, [snapshot.status, cycleSec]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (statusRef.current === 'running') pause();
        else if (statusRef.current === 'settle') cancel();
      }
    });
    return () => sub.remove();
  }, [pause, cancel]);

  const toggle = () => {
    const s = snapshot.status;
    if (s === 'idle') start();
    else if (s === 'settle') cancel();
    else if (s === 'running') pause();
    else if (s === 'paused') resume();
  };

  const endSession = () => {
    navigation.goBack();
  };

  const isIdle = snapshot.status === 'idle';
  const isSettle = snapshot.status === 'settle';
  const isPaused = snapshot.status === 'paused';

  const phaseLabel = isIdle
    ? 'Ready'
    : isSettle
      ? 'Settle in'
      : isPaused
        ? 'Paused'
        : PHASE_LABEL[snapshot.phase.key];

  const bloomSize = Math.max(260, Math.min(width - spacing.md * 2, 340));
  const ringSize = bloomSize + 64;
  const remainingClock = formatClock(Math.max(0, minutes * 60 - snapshot.totalElapsedSec));

  // Nadi shodhana: alternate nostrils each breath. Breath 0 inhales left
  // and exhales right; breath 1 mirrors it. Derived from the engine's
  // breath count so it can never drift from the animation.
  const nadiInhaleSide = snapshot.breathsCompleted % 2 === 0 ? 'Left' : 'Right';
  const nadiLabel =
    snapshot.phase.key === 'inhale'
      ? `Inhale · ${nadiInhaleSide}`
      : snapshot.phase.key === 'exhale'
        ? `Exhale · ${nadiInhaleSide === 'Left' ? 'Right' : 'Left'}`
        : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.ink, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <GrainOverlay />

      {/* Subtle top header — calm and unobtrusive */}
      <View style={styles.topRow}>
        <View style={[styles.metaPill, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          <Text style={[styles.topMeta, { color: colors.ember }]}>
            {presetDisplayName(preset.id)} · {Math.round(preset.breathsPerMinute)} BPM · {minutes} MIN
          </Text>
        </View>
        <Text style={[styles.clockMeta, { color: colors.ash }]}>
          {isIdle ? `${minutes}:00` : remainingClock}
        </Text>
      </View>

      {/* Main meditative sanctum — centered focus */}
      <View style={styles.sanctum}>
        <Pressable
          onPress={toggle}
          android_ripple={{ color: colors.emberDim, borderless: true }}
          style={[styles.bloomPress, { width: ringSize, height: ringSize }]}
          accessibilityRole="button"
          accessibilityLabel={isIdle ? 'Begin' : isPaused ? 'Resume' : 'Pause'}
        >
          {/* Concentric faint hairline rings surrounding the hero bloom */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={bloomSize / 2 + 16}
                fill="none"
                stroke={colors.bone}
                strokeOpacity={isDark ? 0.08 : 0.06}
                strokeWidth={1}
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={bloomSize / 2 + 30}
                fill="none"
                stroke={colors.bone}
                strokeOpacity={isDark ? 0.04 : 0.03}
                strokeWidth={1}
                strokeDasharray="3 5"
              />
            </Svg>
          </View>

          <Bloom
            size={bloomSize}
            phaseKey={snapshot.phase.key}
            phaseSeconds={snapshot.phaseSecondsEff}
            phaseToken={snapshot.phaseToken}
            status={snapshot.status}
            reducedMotion={reducedMotion}
          />
        </Pressable>

        {/* Phase guidance placed right under the Bloom */}
        <View style={styles.guidanceWrap}>
          <Animated.View
            key={`${snapshot.phaseToken}-${snapshot.status}`}
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(200)}
            style={styles.guidanceBox}
          >
            <Text style={[styles.phaseLabel, { color: colors.bone }]}>{phaseLabel}</Text>
            {!isIdle && !isPaused && (
              <Text style={[styles.countdownNumber, { color: colors.ember }]}>
                {isSettle ? `${snapshot.settleRemainingSec}` : `${snapshot.phaseRemainingSec}s`}
              </Text>
            )}
            {isIdle && (
              <Text style={[styles.hint, { color: colors.ash }]}>Tap the mandala to begin</Text>
            )}
            {isSettle && (
              <Text style={[styles.hint, { color: colors.ash }]}>Close your eyes, breathe through nose</Text>
            )}
            {isNadi && snapshot.status === 'running' && nadiLabel && (
              <Text style={[styles.nadiPill, { color: colors.ember }]}>{nadiLabel}</Text>
            )}
            {ujjayiUnlocked && !isIdle && (
              <View style={styles.ujjayiRow}>
                <Text style={[styles.ujjayiLabel, { color: colors.ash }]}>Ujjayi cue</Text>
                <EmberToggle value={ujjayiOn} onPress={() => setUjjayiOn((v) => !v)} />
              </View>
            )}
            {ujjayiUnlocked && ujjayiOn && !isIdle && !isPaused && (
              <Text style={[styles.ujjayiHint, { color: colors.ashMuted }]}>
                Soften the throat · faint ocean sound
              </Text>
            )}
            {isKumbhaka && isIdle && (
              <Text style={[styles.hint, { color: colors.ash }]}>Hold only to comfort · never strain</Text>
            )}
            {snapshot.status === 'running' && (
              <Text style={[styles.breathCounter, { color: colors.ashMuted }]}>
                Breath {snapshot.breathsCompleted + 1}
              </Text>
            )}
          </Animated.View>
        </View>
      </View>

      {/* Tactile minimal bottom controls */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={toggle}
          hitSlop={14}
          android_ripple={{ color: colors.emberDim, borderless: true }}
          style={[styles.controlPill, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          accessibilityLabel={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused || isIdle || isSettle ? (
            <PlayIcon size={24} color={colors.ember} />
          ) : (
            <PauseIcon size={24} color={colors.bone} />
          )}
        </Pressable>

        <Pressable onPress={endSession} hitSlop={14} style={styles.endButton}>
          <Text style={[styles.endLabel, { color: colors.ash }]}>Exit</Text>
        </Pressable>
      </View>

      {/* Frosted Pause Scrim */}
      {isPaused && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(17,20,28,0.85)' : 'rgba(246,241,231,0.85)' }]}>
          <BlurView intensity={35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.scrim, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Bloom
              size={bloomSize * 0.7}
              phaseKey={snapshot.phase.key}
              phaseSeconds={snapshot.phaseSecondsEff}
              phaseToken={snapshot.phaseToken}
              status={snapshot.status}
              frozen
              reducedMotion
            />
            <Text style={[styles.scrimTitle, { color: colors.bone }]}>Practice Paused</Text>
            <Text style={[styles.scrimSub, { color: colors.ash }]}>
              {formatClock(snapshot.totalElapsedSec)} elapsed · {snapshot.breathsCompleted} breaths completed
            </Text>
            <View style={styles.scrimButton}>
              <PrimaryButton label="Resume Practice" onPress={resume} />
            </View>
            <Pressable onPress={endSession} style={styles.scrimExit}>
              <Text style={[styles.scrimExitText, { color: colors.ashMuted }]}>End Session Early</Text>
            </Pressable>
            <Text style={[styles.scrimExitNote, { color: colors.ashMuted }]}>
              Leaving now won&apos;t record this session.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  topMeta: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  clockMeta: {
    fontFamily: fonts.serifSemi,
    fontSize: 17,
    letterSpacing: 0.5,
  },
  sanctum: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloomPress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceWrap: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  guidanceBox: {
    alignItems: 'center',
  },
  phaseLabel: {
    fontFamily: fonts.serifSemi,
    fontSize: 22,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  countdownNumber: {
    fontFamily: fonts.serifSemi,
    fontSize: 36,
    marginTop: 4,
    lineHeight: 42,
  },
  hint: {
    fontSize: 14,
    marginTop: 8,
  },
  breathCounter: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginTop: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  controlPill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  endLabel: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  scrimTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 26,
    marginTop: spacing.md,
  },
  scrimSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scrimButton: {
    width: '100%',
    maxWidth: 280,
  },
  scrimExit: {
    marginTop: spacing.sm,
    paddingVertical: 8,
  },
  scrimExitText: {
    fontSize: 13,
  },
  scrimExitNote: {
    fontSize: 11,
    marginTop: 2,
  },
  nadiPill: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  ujjayiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  ujjayiLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  ujjayiHint: {
    fontSize: 12,
    marginTop: 4,
  },
});

/**
 * "The Prana Bloom" — Sacred geometric breath mandala.
 * Adapts to both Light (Warm Ivory & Deep Blue) and Dark (Nocturnal & Ember) modes.
 * Physiological asymmetric curves, layered sacred petals, and pulsing prana aura.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  FeColorMatrix,
  FeTurbulence,
  Filter,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../theme';
import type { PhaseKey } from '../data/presets';
import type { EngineStatus } from '../engine/useBreathEngine';

/** Inhale: fast start, soft taper at top. */
const EASE_INHALE = Easing.out(Easing.sin);
/** Exhale: slow start, accelerating flow. */
const EASE_EXHALE = Easing.in(Easing.sin);

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SUB_PETAL_ANGLES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

/** Major petal pointing up from center. */
function MajorPetal({ angle, color }: { angle: number; color: string }) {
  return (
    <G rotation={angle} origin="150, 150">
      <Path
        d="M150 150 C138 116, 138 78, 150 42 C162 78, 162 116, 150 150 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
    </G>
  );
}

/** Minor petal layered between major petals. */
function MinorPetal({ angle, color }: { angle: number; color: string }) {
  return (
    <G rotation={angle} origin="150, 150">
      <Path
        d="M150 150 C143 124, 143 96, 150 70 C157 96, 157 124, 150 150 Z"
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.4}
      />
    </G>
  );
}

export interface BloomProps {
  size: number;
  phaseKey: PhaseKey;
  phaseSeconds: number;
  phaseToken: number;
  status: EngineStatus;
  frozen?: boolean;
  reducedMotion?: boolean;
}

function targetFor(key: PhaseKey): number {
  if (key === 'inhale' || key === 'holdIn') return 1;
  return 0; // exhale, holdOut
}

export function Bloom({
  size,
  phaseKey,
  phaseSeconds,
  phaseToken,
  status,
  frozen = false,
  reducedMotion = false,
}: BloomProps) {
  const { colors, isDark } = useTheme();
  const progress = useSharedValue(0);

  const runPhase = (key: PhaseKey) => {
    cancelAnimation(progress);
    const target = targetFor(key);
    if (reducedMotion || key === 'holdIn' || key === 'holdOut') {
      progress.value = target;
      return;
    }
    progress.value = withTiming(target, {
      duration: Math.max(250, phaseSeconds * 1000),
      easing: key === 'exhale' ? EASE_EXHALE : EASE_INHALE,
    });
  };

  const resumePhase = (key: PhaseKey) => {
    cancelAnimation(progress);
    const target = targetFor(key);
    if (reducedMotion || key === 'holdIn' || key === 'holdOut') {
      progress.value = target;
      return;
    }
    const remaining = Math.abs(target - progress.value) * phaseSeconds * 1000;
    progress.value = withTiming(target, {
      duration: Math.max(250, remaining),
      easing: key === 'exhale' ? EASE_EXHALE : EASE_INHALE,
    });
  };

  useEffect(() => {
    if (status === 'running') runPhase(phaseKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseToken]);

  useEffect(() => {
    if (status === 'running') resumePhase(phaseKey);
    else cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const bloomStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const scale = 0.82 + 0.20 * p;
    const rotate = 10 * p;
    let opacity = 0.65 + 0.35 * p;
    if (frozen) opacity = 0.35;
    return {
      transform: [{ scale }, { rotate: `${rotate}deg` }],
      opacity,
    };
  });

  const auraStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const scale = 0.75 + 0.35 * p;
    const opacity = 0.25 + 0.45 * p;
    return {
      transform: [{ scale }],
      opacity: frozen ? 0.15 : opacity,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Soft pulsating radial prana aura */}
      <Animated.View style={[StyleSheet.absoluteFill, auraStyle]}>
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="pranaAura" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.ember} stopOpacity={isDark ? 0.32 : 0.18} />
              <Stop offset="60%" stopColor={colors.ember} stopOpacity={isDark ? 0.08 : 0.04} />
              <Stop offset="100%" stopColor={colors.ember} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={150} cy={150} r={140} fill="url(#pranaAura)" />
        </Svg>
      </Animated.View>

      {/* Main geometric mandala */}
      <Animated.View style={bloomStyle}>
        <Svg width={size} height={size} viewBox="0 0 300 300">
          {/* Subtle concentric boundary orbits */}
          <Circle
            cx={150}
            cy={150}
            r={112}
            fill="none"
            stroke={colors.bone}
            strokeOpacity={isDark ? 0.14 : 0.10}
            strokeWidth={1}
            strokeDasharray="4 6"
          />
          <Circle
            cx={150}
            cy={150}
            r={88}
            fill="none"
            stroke={colors.ember}
            strokeOpacity={isDark ? 0.20 : 0.15}
            strokeWidth={1}
          />

          {/* Minor intermediate petals */}
          {SUB_PETAL_ANGLES.map((a) => (
            <MinorPetal key={`sub-${a}`} angle={a} color={colors.bone} />
          ))}

          {/* Major sacred petals */}
          {PETAL_ANGLES.map((a) => (
            <MajorPetal key={`maj-${a}`} angle={a} color={colors.bone} />
          ))}

          {/* Center heart Bindu with coral aura */}
          <Circle cx={150} cy={150} r={10} fill={colors.emberDim} />
          <Circle cx={150} cy={150} r={4} fill={colors.ember} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Film grain + subtle warm vignette.
 * Physical, paper/celluloid texture — the hallmark anti-slop detail.
 */
export function GrainOverlay() {
  const { colors, isDark } = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Filter id="filmGrain" x="-20%" y="-20%" width="140%" height="140%">
            <FeTurbulence type="fractalNoise" baseFrequency="0.88" numOctaves={2} stitchTiles="stitch" />
            <FeColorMatrix
              type="matrix"
              values={
                isDark
                  ? '0 0 0 0 0.96, 0 0 0 0 0.94, 0 0 0 0 0.91, 0 0 0 0.45 0'
                  : '0 0 0 0 0.11, 0 0 0 0 0.23, 0 0 0 0 0.42, 0 0 0 0.55 0'
              }
            />
          </Filter>
          <RadialGradient id="filmVignette" cx="50%" cy="50%" r="75%">
            <Stop offset="50%" stopColor={colors.bone} stopOpacity={0} />
            <Stop offset="100%" stopColor={colors.bone} stopOpacity={isDark ? 0.08 : 0.045} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" filter="url(#filmGrain)" opacity={colors.grainOpacity} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#filmVignette)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

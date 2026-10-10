/**
 * BackdropBloom — an ambient watermark for screen backgrounds.
 *
 * A large, very faint line-art bloom sitting behind all content,
 * with a slow, barely-there breathing oscillation (~12s cycle).
 * Transform-only animation on the native driver; non-interactive.
 * Adapts dynamically to light and dark theme.
 */
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from '../theme';

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function WatermarkPetal({ angle, color }: { angle: number; color: string }) {
  return (
    <G rotation={angle} origin="120, 120">
      <Path
        d="M120 120 C112 96, 112 70, 120 46 C128 70, 128 96, 120 120 Z"
        fill="none"
        stroke={color}
        strokeWidth={1}
      />
    </G>
  );
}

interface BackdropBloomProps {
  /** Bloom diameter in px. */
  size?: number;
  /** Vertical offset from center in px (negative = up). */
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
}

export function BackdropBloom({ size = 560, offsetY = -60, style }: BackdropBloomProps) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const breath = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    breath.value = withRepeat(
      withTiming(1.045, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, style]}>
      <View style={{ marginTop: offsetY }}>
        <Animated.View style={[animatedStyle, { opacity: isDark ? 0.05 : 0.04 }]}>
          <Svg width={size} height={size} viewBox="0 0 240 240">
            {PETAL_ANGLES.map((a) => (
              <WatermarkPetal key={a} angle={a} color={colors.bone} />
            ))}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

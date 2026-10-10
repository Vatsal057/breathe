/**
 * WatermarkNumeral — a giant ghosted Fraunces numeral behind a stat block.
 * Adapts dynamically to light and dark theme.
 */
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { fonts, useTheme } from '../theme';

interface WatermarkNumeralProps {
  value: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function WatermarkNumeral({ value, size = 150, style, textStyle }: WatermarkNumeralProps) {
  const { colors, isDark } = useTheme();

  return (
    <View pointerEvents="none" style={[styles.wrap, { opacity: isDark ? 0.06 : 0.045 }, style]}>
      <Text style={[styles.numeral, { fontSize: size, color: colors.bone }, textStyle]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  numeral: {
    fontFamily: fonts.serif,
  },
});

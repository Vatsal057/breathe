/**
 * Custom 1.5px-stroke icon set for the Night Ember direction.
 * No emoji, no stock icons, no sparkles.
 */
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

const STROKE = 1.5;

interface IconProps {
  size?: number;
  color?: string;
}

function Base({
  size = 24,
  color = colors.bone,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

function strokeProps(color: string) {
  return {
    stroke: color,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
}

/** Two-petal breathing mark — the loader and the app's smallest motif. */
export function PetalMark({ size = 24, color = colors.ember }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M12 12 C15 7.5, 19 7.5, 22 12 C19 16.5, 15 16.5, 12 12 Z" {...strokeProps(color)} />
      <Path d="M12 12 C9 7.5, 5 7.5, 2 12 C5 16.5, 9 16.5, 12 12 Z" {...strokeProps(color)} />
    </Base>
  );
}

/** Small filled 8-petal bloom stamp — history rows, completion. */
export function BloomStamp({ size = 20, color = colors.ember }: IconProps) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {petals.map((deg) => (
        <Path
          key={deg}
          d="M12 12 C13.2 9, 13.2 6, 12 3.4 C10.8 6, 10.8 9, 12 12 Z"
          fill={color}
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </Svg>
  );
}

export function PlayIcon({ size = 24, color = colors.bone }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M8 5.5 L18 12 L8 18.5 Z" {...strokeProps(color)} />
    </Base>
  );
}

export function PauseIcon({ size = 24, color = colors.bone }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M9 5.5 L9 18.5" {...strokeProps(color)} />
      <Path d="M15 5.5 L15 18.5" {...strokeProps(color)} />
    </Base>
  );
}

export function BackIcon({ size = 24, color = colors.bone }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M14.5 5.5 L8 12 L14.5 18.5" {...strokeProps(color)} />
    </Base>
  );
}

export function CheckIcon({ size = 24, color = colors.ember }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M4.5 12.5 L10 18 L19.5 6.5" {...strokeProps(color)} />
    </Base>
  );
}

/** Tab glyph: bloom mark. */
export function TabHomeGlyph({ size = 24, color }: IconProps & { color: string }) {
  return <PetalMark size={size} color={color} />;
}

/** Tab glyph: open book — the story. */
export function TabWhyGlyph({ size = 24, color }: IconProps & { color: string }) {
  return (
    <Base size={size} color={color}>
      <Path d="M4 5.5 C7 4.4, 10 4.4, 12 6.2 C14 4.4, 17 4.4, 20 5.5 L20 18.5 C17 17.4, 14 17.4, 12 19.2 C10 17.4, 7 17.4, 4 18.5 Z" {...strokeProps(color)} />
      <Path d="M12 6.2 L12 19.2" {...strokeProps(color)} />
    </Base>
  );
}

/** Tab glyph: ascending steps — progress. */
export function TabProgressGlyph({ size = 24, color }: IconProps & { color: string }) {
  return (
    <Base size={size} color={color}>
      <Path d="M3.5 19.5 H8.5 V14.5 H13.5 V9.5 H18.5 V4.5" {...strokeProps(color)} />
    </Base>
  );
}

/** Tab glyph: contour lines with a marker — the angul map. */
export function TabMapGlyph({ size = 24, color }: IconProps & { color: string }) {
  return (
    <Base size={size} color={color}>
      <Path d="M3.5 17 C8 13.5, 16 13.5, 20.5 17" {...strokeProps(color)} />
      <Path d="M6.5 12.5 C10 10, 14 10, 17.5 12.5" {...strokeProps(color)} />
      <Path d="M12 8.2 C13.4 8.2, 13.4 6, 12 6 C10.6 6, 10.6 8.2, 12 8.2 Z" {...strokeProps(color)} />
    </Base>
  );
}

/**
 * Design tokens & Theme System — "Vibrant Ivory & Nocturnal Ember".
 * Supports both Warm Ivory Light Mode and Nocturnal Ember Dark Mode.
 * Fraunces editorial typography, tactile hairlines, and physiological easing.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { loadSettings, saveSettings } from './storage/stats';

export type ThemeMode = 'system' | 'light' | 'dark';

/** Warm Ivory Light Palette (The "Vibrant" theme Vatsal selected). */
export const lightPalette = {
  ink: '#F6F1E7',             // Warm ivory canvas
  surface: '#EFE8D8',         // Recessed panels & cards
  surfaceSubtle: '#E6DECA',   // Elevated card surfaces
  surfaceHighlight: '#DED5BD',// Selected / active highlights
  bone: '#1B3A6B',            // Deep navy content & titles
  ash: '#5C6E8C',             // Muted slate labels
  ashMuted: '#8595AC',        // Tertiary captions
  ember: '#FF7F50',           // THE vibrant coral accent
  emberDim: 'rgba(255, 127, 80, 0.14)',
  emberGlow: 'rgba(255, 127, 80, 0.24)',
  emberFaint: 'rgba(255, 127, 80, 0.45)',
  emberBoundary: 'rgba(255, 127, 80, 0.22)',
  gold: '#D99B26',            // Ancient scriptural gold
  goldDim: 'rgba(217, 155, 38, 0.12)',
  hairline: 'rgba(27, 58, 107, 0.12)',
  hairlineStrong: 'rgba(27, 58, 107, 0.22)',
  grainColor: '#1B3A6B',
  grainOpacity: 0.035,
  danger: '#C95A50',
  isDark: false,
} as const;

/** Nocturnal Ember Dark Palette (The "Night Ember" theme). */
export const darkPalette = {
  ink: '#11141C',             // Deep nocturnal obsidian
  surface: '#181E29',         // Recessed panels & cards
  surfaceSubtle: '#222938',   // Elevated card surfaces
  surfaceHighlight: '#2C3548',// Selected / active highlights
  bone: '#F6F1E7',            // Warm ivory content & titles
  ash: '#7E8FA8',             // Muted silver-slate labels
  ashMuted: '#4F5E74',        // Tertiary captions
  ember: '#FF7F50',           // Luminous coral / ember accent
  emberDim: 'rgba(255, 127, 80, 0.16)',
  emberGlow: 'rgba(255, 127, 80, 0.30)',
  emberFaint: 'rgba(255, 127, 80, 0.50)',
  emberBoundary: 'rgba(255, 127, 80, 0.25)',
  gold: '#E5A93C',            // Radiant prana gold
  goldDim: 'rgba(229, 169, 60, 0.15)',
  hairline: 'rgba(246, 241, 231, 0.10)',
  hairlineStrong: 'rgba(246, 241, 231, 0.18)',
  grainColor: '#F6F1E7',
  grainOpacity: 0.025,
  danger: '#E25C50',
  isDark: true,
} as const;

export type ThemeColors = typeof lightPalette | typeof darkPalette;

/** Static default palette (defaults to light Vibrant theme). */
export const colors = lightPalette;

export const fonts = {
  /** Fraunces — display numerals, screen titles. */
  serif: 'Fraunces_400Regular',
  serifSemi: 'Fraunces_600SemiBold',
} as const;

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 36,
  xl: 56,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 28,
  full: 9999,
} as const;

export const easing = {
  breath: [0.45, 0, 0.25, 1] as const,
  chrome: [0.16, 1, 0.3, 1] as const,
} as const;

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightPalette,
  isDark: false,
  themeMode: 'system',
  setThemeMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (alive && s.themeMode) {
        setThemeModeState(s.themeMode);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveSettings({ themeMode: mode });
  };

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  const activeColors = useMemo(() => (isDark ? darkPalette : lightPalette), [isDark]);

  const value = useMemo(
    () => ({
      colors: activeColors,
      isDark,
      themeMode,
      setThemeMode,
    }),
    [activeColors, isDark, themeMode],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

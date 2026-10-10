import type { NavigatorScreenParams } from '@react-navigation/native';

/** Guided session prescribed by the program step. The app sets it. */
export type SessionTechniqueId = 'pacer' | 'nadi' | 'kumbhaka';

export type TabParamList = {
  Home: undefined;
  Map: undefined;
  Progress: undefined;
  Learn: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Session: { targetBpm: number; step: number; minutes: number; techniqueId?: SessionTechniqueId };
  Complete: { targetBpm: number; step: number; minutes: number; breaths: number; elapsedSec: number; techniqueId?: SessionTechniqueId; actualBpm?: number };
  Measure: undefined;
};

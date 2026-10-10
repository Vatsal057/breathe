/**
 * Session shapes: one exhale-dominant pace plus two technique variants.
 *
 * What the root text actually gives: the breath measurement
 * (Rama Prasad vv. 216–218: 10 fingers in, 12 out; 24/42/65/100 by
 * activity) and the siddhi table (vv. 219–222). It prescribes NO
 * step-by-step technique — v. 223 says the practice passes from
 * teacher to student. The method here comes from the commentarial
 * tradition (Bihar School): breath awareness + pranayama to shorten
 * the exhale. This schedule is a modern construction of that idea,
 * said plainly: one exhale-dominant pace that gets slower as you
 * improve, 10 minutes a day, with nadi shodhana and kumbhaka variants
 * at the later steps.
 */

export type PhaseKey = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export interface PhaseDef {
  key: PhaseKey;
  label: string;
  seconds: number;
}

export interface RhythmPreset {
  id: string;
  name: string;
  phases: PhaseDef[];
  cycleSeconds: number;
  breathsPerMinute: number;
}

export interface SessionDuration {
  mode: 'minutes' | 'breaths' | 'open';
  /** Required when mode === 'minutes'. */
  minutes?: number;
  /** Required when mode === 'breaths'. */
  breaths?: number;
}

/**
 * Build the program preset for a target breaths/min pace.
 * Exhale-dominant: 40% inhale, 60% exhale. No holds — the method is
 * simply slower, subtler breathing through the nose.
 */
export function buildProgramPreset(targetBpm: number): RhythmPreset {
  const cycle = 60 / targetBpm;
  const inhale = Math.round(cycle * 0.4 * 2) / 2;
  const exhale = Math.round((cycle - inhale) * 2) / 2;
  const phases: PhaseDef[] = [
    { key: 'inhale', label: 'Breathe in', seconds: inhale },
    { key: 'exhale', label: 'Breathe out', seconds: exhale },
  ];
  const cycleSeconds = inhale + exhale;
  return {
    id: 'program',
    name: 'Daily practice',
    phases,
    cycleSeconds,
    breathsPerMinute: Math.round((60 / cycleSeconds) * 10) / 10,
  };
}

/**
 * Nadi shodhana: the same 40/60 inhale/exhale shape as the pacer.
 * A distinct id keeps history rows labeled honestly. The L/R side
 * indicator is derived in the session screen from breathsCompleted.
 */
export function buildNadiPreset(targetBpm: number): RhythmPreset {
  const base = buildProgramPreset(targetBpm);
  return { ...base, id: 'nadi', name: 'Nadi shodhana' };
}

/**
 * Kumbhaka builder: pacer shape plus a fixed comfortable hold after
 * the inhale. The hold stays fixed; progression comes from the
 * program steps, not from stretching the retention.
 */
export function buildKumbhakaPreset(targetBpm: number, holdSec = 4): RhythmPreset {
  const cycle = 60 / targetBpm;
  const inhale = Math.round(cycle * 0.4 * 2) / 2;
  const exhale = Math.round((cycle - inhale) * 2) / 2;
  const phases: PhaseDef[] = [
    { key: 'inhale', label: 'Breathe in', seconds: inhale },
    { key: 'holdIn', label: 'Rest full', seconds: holdSec },
    { key: 'exhale', label: 'Breathe out', seconds: exhale },
  ];
  const cycleSeconds = inhale + holdSec + exhale;
  return {
    id: 'kumbhaka',
    name: 'Kumbhaka builder',
    phases,
    cycleSeconds,
    breathsPerMinute: Math.round((60 / cycleSeconds) * 10) / 10,
  };
}

/**
 * Display name for a preset id in history rows. Older installs may
 * have rows naming retired presets — they all read as Daily practice.
 */
export function presetDisplayName(id: string): string {
  if (id === 'nadi') return 'Nadi shodhana';
  if (id === 'kumbhaka') return 'Kumbhaka builder';
  return 'Daily practice';
}

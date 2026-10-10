/**
 * Practice milestones — bridging Shiv Swarodaya with modern breath rate targets.
 *
 * Each level represents an angul reduction milestone from normal 12 anguls down to 8,
 * mapped to resting breaths-per-minute targets.
 */

export interface BreathLevel {
  /** 1–4. */
  level: number;
  /** Sanskrit traditional designation. */
  sanskrit: string;
  /** English title. */
  name: string;
  /** Traditional Swarodaya fruit / state. */
  fruit: string;
  /** Modern physiological translation. */
  meaning: string;
  /** Resting breaths/min at or below this reaches the milestone. */
  maxBpm: number;
}

export const BREATH_LEVELS: BreathLevel[] = [
  {
    level: 1,
    sanskrit: 'निष्कामता',
    name: 'Nishkamta',
    fruit: 'Desirelessness & Inner Quiet',
    meaning: 'Mental turbulence settles; reactive cravings fade.',
    maxBpm: 11,
  },
  {
    level: 2,
    sanskrit: 'आनंद',
    name: 'Anand',
    fruit: 'Unconditional Bliss',
    meaning: 'Vagal nerve tone deepens; continuous baseline contentment.',
    maxBpm: 10,
  },
  {
    level: 3,
    sanskrit: 'कविता',
    name: 'Kavita',
    fruit: 'Poetic Fluency & Creative Flow',
    meaning: 'Verbal effortless flow; spontaneous clarity in expression.',
    maxBpm: 9,
  },
  {
    level: 4,
    sanskrit: 'वाणी सिद्धि',
    name: 'Vak Siddhi',
    fruit: 'Mastery of Speech',
    meaning: 'Every word spoken carries weight, stillness, and deliberate authority.',
    maxBpm: 8,
  },
];

/** Highest milestone reached by a resting rate, or null when unmeasured. */
export function levelForBpm(bpm: number | null): BreathLevel | null {
  if (bpm == null) return null;
  let current: BreathLevel | null = null;
  for (const l of BREATH_LEVELS) {
    if (bpm <= l.maxBpm) current = l;
  }
  return current;
}

/** The next milestone above the one reached, or null at the top. */
export function nextLevelForBpm(bpm: number | null): BreathLevel | null {
  const current = levelForBpm(bpm);
  if (!current) return BREATH_LEVELS[0];
  const idx = BREATH_LEVELS.indexOf(current);
  return idx < BREATH_LEVELS.length - 1 ? BREATH_LEVELS[idx + 1] : null;
}

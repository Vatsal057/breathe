/**
 * The techniques: traditional practices alongside the pacer,
 * unlocked progressively as the program advances.
 *
 * Pure data, like angul.ts and levels.ts. The program step
 * (0-indexed, stored in settings.programStep) is the single
 * source of truth for unlocks. Steps display 1-indexed, so
 * unlockStep 1 reads as "Step 2" in the UI.
 *
 * Copy rules: short plain sentences, no em dashes, no buzzwords,
 * no promised siddhis. Kumbhaka carries its safety note on the page.
 */

export type TechniqueKind = 'foundation' | 'cue' | 'session' | 'instructional';

export type TechniqueId = 'pacer' | 'ujjayi' | 'nadi' | 'kumbhaka' | 'thread';

export interface Technique {
  id: TechniqueId;
  kind: TechniqueKind;
  name: string;
  sanskrit: string;
  /** One plain line: what it is. Shown even when locked. */
  tagline: string;
  /** What it is, in at most two short sentences. */
  what: string[];
  /** How to do it, at most three steps. */
  steps: string[];
  /** When it applies in the program. */
  when: string;
  /** Safety copy. Kumbhaka only. */
  safety?: string;
  /** Program step (0-indexed) that unlocks it. */
  unlockStep: number;
}

export const TECHNIQUES: Technique[] = [
  {
    id: 'pacer',
    kind: 'foundation',
    name: 'Paced breathing',
    // The app's own name for the practice ('natural breath regulation'),
    // not a cited traditional term.
    sanskrit: 'सहज प्राणायाम',
    tagline: 'Slow nasal breathing at the pace the app sets.',
    what: [
      'You breathe in and out through the nose, following the bloom.',
      'The pace slows as the weeks pass. This is the base of everything.',
    ],
    steps: [
      'Sit straight and close your eyes.',
      'Breathe in and out through the nose, following the bloom.',
      'Keep the exhale soft and quiet.',
    ],
    when: 'Every daily session, from day one.',
    unlockStep: 0,
  },
  {
    id: 'ujjayi',
    kind: 'cue',
    name: 'Ujjayi',
    sanskrit: 'उज्जायी',
    tagline: 'A soft narrowing at the throat that slows the breath.',
    what: [
      'You narrow the throat slightly on inhale and exhale, making a faint ocean sound.',
      'The narrower passage slows the air, so the exhale stays short without force.',
    ],
    steps: [
      'Breathe through the nose as usual.',
      'Gently constrict the back of the throat, as if fogging a mirror with the mouth closed.',
      'Keep it soft. If the throat tires, drop it and breathe normally.',
    ],
    when: 'Available as a cue in your sessions from Step 2.',
    unlockStep: 1,
  },
  {
    id: 'nadi',
    kind: 'session',
    name: 'Nadi shodhana',
    sanskrit: 'नाड़ी शोधन',
    tagline: 'Alternate-nostril breathing that steadies the breath.',
    what: [
      'You breathe in through one nostril and out through the other, then switch.',
      'The app shows which side to use on each breath.',
      'This is the simplified form: inhale and exhale only, no held retentions.',
    ],
    steps: [
      'Rest the right thumb by the right nostril and the ring finger by the left.',
      'Inhale left, close left, exhale right. Inhale right, close right, exhale left. That is one round.',
      'Follow the L/R pill on screen and keep the breath slow and even.',
    ],
    when: 'Your daily session becomes this automatically at Step 3.',
    unlockStep: 2,
  },
  {
    id: 'kumbhaka',
    kind: 'session',
    name: 'Kumbhaka',
    sanskrit: 'कुम्भक',
    tagline: 'Comfortable breath retention that builds CO2 tolerance.',
    what: [
      'After the inhale, you rest with full lungs for a few seconds before exhaling.',
      'Short easy holds teach the body to stay calm with more CO2, which steadies the breath after.',
    ],
    steps: [
      'Inhale smoothly through the nose.',
      'Rest with full lungs. Do not strain and do not gulp more air.',
      'Exhale softly at the first gentle urge to breathe.',
    ],
    when: 'Your daily session becomes this automatically at Step 4.',
    safety:
      'Stop at dizziness or tingling. Never hold the breath in water or while driving. Skip retention if you have blood pressure or heart conditions, or are pregnant. Slow breathing alone is always fine.',
    unlockStep: 3,
  },
  {
    id: 'thread',
    kind: 'instructional',
    name: 'Thread test',
    sanskrit: '',
    tagline: 'The old way to check how subtle your exhale has become.',
    what: [
      'Hold a fine thread a few finger-widths under your nose.',
      'Breathe out normally. The steadier your practice, the less it moves.',
    ],
    steps: [
      'Sit still and breathe through the nose.',
      'Hold the thread about four finger-widths below your nostrils.',
      'Exhale as usual and watch. Less movement means a subtler breath.',
    ],
    when: 'Try it any week from Step 2. It is a ritual, not a score.',
    unlockStep: 1,
  },
];

export function techniqueById(id: TechniqueId): Technique {
  return TECHNIQUES.find((t) => t.id === id) ?? TECHNIQUES[0];
}

/** True when the technique is unlocked at the given program step. */
export function isTechniqueUnlocked(t: Technique, step: number): boolean {
  return step >= t.unlockStep;
}

/**
 * The guided session the app prescribes at a program step.
 * The app sets the technique; the user just follows.
 */
export function sessionTechniqueForStep(step: number): 'pacer' | 'nadi' | 'kumbhaka' {
  if (step >= 3) return 'kumbhaka';
  if (step >= 2) return 'nadi';
  return 'pacer';
}

/** Quiet one-line label for the Home prescription card. */
export function displayTechniqueForStep(step: number): string {
  if (step >= 3) return 'Kumbhaka';
  if (step >= 2) return 'Nadi shodhana';
  if (step >= 1) return 'Paced breathing, ujjayi cue';
  return 'Paced breathing';
}

/** Techniques newly unlocked when the program reaches a step. */
export function techniquesUnlockedAtStep(step: number): Technique[] {
  return TECHNIQUES.filter((t) => t.unlockStep === step && t.unlockStep > 0);
}

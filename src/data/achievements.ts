/**
 * Achievements — a small, editorially named set. Quiet by design:
 * the list shows unlocked names with their dates; locked ones show
 * the name dimmed, with no spoilers beyond the name.
 *
 * Safety rule, non-negotiable: nothing here rewards longer breath
 * holds. Showing up is rewarded; pushing is never rewarded.
 */
import { dayKeyOf, type ControlPause, type Stats } from '../storage/stats';

export interface AchievementDef {
  id: string;
  name: string;
  hint: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_breath', name: 'First Breath', hint: 'Complete your first session.' },
  { id: 'ten_sessions', name: 'Ten Sessions', hint: 'Complete 10 sessions.' },
  { id: 'twentyfive_sessions', name: 'Twenty-five Sessions', hint: 'Complete 25 sessions.' },
  { id: 'seven_day_streak', name: 'Seven Days', hint: 'Practice 7 days in a row.' },
  { id: 'first_measure', name: 'First Measure', hint: 'Log your first control pause.' },
  { id: 'steady_measure', name: 'Steady Measure', hint: 'Measure your control pause 4 weeks running.' },
  { id: 'step_two', name: 'Step Two', hint: 'Reach Step 2 of the program.' },
  { id: 'step_three', name: 'Step Three', hint: 'Reach Step 3 of the program.' },
  { id: 'step_four', name: 'Step Four', hint: 'Reach Step 4 of the program.' },
];

/**
 * Achievement ids for program steps crossed between two saves.
 * Steps are 0-indexed internally; step_two unlocks at step 1, etc.
 */
export function programStepAchievements(prevStep: number, nextStep: number): string[] {
  const ids = ['step_two', 'step_three', 'step_four'];
  const out: string[] = [];
  for (let s = prevStep + 1; s <= nextStep && s <= 3; s += 1) {
    out.push(ids[s - 1]);
  }
  return out;
}

export function achievementName(id: string): string {
  return ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;
}

/** Candidate achievement ids earned by the latest session stats. */
export function sessionAchievements(stats: Stats): string[] {
  const ids: string[] = [];
  if (stats.totalSessions >= 1) ids.push('first_breath');
  if (stats.totalSessions >= 10) ids.push('ten_sessions');
  if (stats.totalSessions >= 25) ids.push('twentyfive_sessions');
  if (stats.streakDays >= 7) ids.push('seven_day_streak');
  return ids;
}

/** Monday-start week key for a day key. */
function weekStartKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const mondayOffset = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - mondayOffset);
  return dayKeyOf(dt);
}

/**
 * How many consecutive recent calendar weeks (including this one)
 * contain at least one logged control pause.
 */
export function measuredWeeksRunning(pauses: ControlPause[]): number {
  const weeks = new Set(pauses.map((p) => weekStartKey(p.dayKey)));
  let count = 0;
  const cursor = new Date();
  for (;;) {
    if (!weeks.has(weekStartKey(dayKeyOf(cursor)))) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return count;
}

/** Candidate achievement ids earned by the latest control-pause log. */
export function controlPauseAchievements(pauses: ControlPause[]): string[] {
  const ids: string[] = [];
  if (pauses.length === 0) return ids;
  ids.push('first_measure');
  // Consistency, not depth: measuring regularly is what improves.
  if (measuredWeeksRunning(pauses) >= 4) ids.push('steady_measure');
  return ids;
}

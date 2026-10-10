/**
 * The progressive program: one pace per step, slower as you improve.
 *
 * Steps advance on COMPLETED SESSIONS, not calendar days — 7 sessions
 * per step. After a 7+ day gap with no sessions, the program drops back
 * one step with a kind line: the prescription must never punish.
 *
 * The terminal pace is the user's chosen goal (11/10/9/8 breaths a
 * minute for goal levels 1–4). The schedule steps down 1/min per step
 * toward it, then holds there in maintenance.
 *
 * Adaptive: if a logged resting rate already beats the next step's
 * target, the pace moves ahead early. The app sets the pace — the
 * user just follows.
 */
import { dayKeyOf, daysBetweenDayKeys, type RestingCheckin } from '../storage/stats';

export const SESSIONS_PER_STEP = 7;
export const MAX_STEP = 3;
const GAP_DAYS_FOR_EASE_BACK = 7;

/** Terminal pace from the user's goal level (1–4): 11, 10, 9, 8. */
export function terminalBpmForGoal(goalLevel: 1 | 2 | 3 | 4): number {
  return 12 - goalLevel;
}

/** Scheduled target for a step, clamped to the terminal pace. */
export function targetBpmForStep(step: number, terminalBpm: number): number {
  const scheduled = 11 - Math.max(0, Math.min(MAX_STEP, step));
  return Math.max(terminalBpm, scheduled);
}

export interface ProgramState {
  step: number;
  targetBpm: number;
  /** True when the resting check-in moved the pace ahead of the schedule. */
  advancedEarly: boolean;
}

export function effectiveProgram(
  restingBpm: number | null,
  step: number,
  terminalBpm: number,
): ProgramState {
  let s = Math.max(0, Math.min(MAX_STEP, step));
  let advancedEarly = false;
  if (restingBpm != null && s < MAX_STEP) {
    const nextTarget = targetBpmForStep(s + 1, terminalBpm);
    const curTarget = targetBpmForStep(s, terminalBpm);
    if (nextTarget < curTarget && restingBpm <= nextTarget) {
      s += 1;
      advancedEarly = true;
    }
  }
  return { step: s, targetBpm: targetBpmForStep(s, terminalBpm), advancedEarly };
}

export interface StepAdvance {
  step: number;
  stepSessions: number;
  /** True when a long gap dropped the program back a step. */
  easedBack: boolean;
}

/**
 * Compute the next program step after a completed session.
 * lastSessionDayKey is the day BEFORE this session (null if first ever).
 */
export function programStepAfterSession(
  prevStep: number,
  prevStepSessions: number,
  lastSessionDayKey: string | null,
  todayKey: string,
): StepAdvance {
  if (lastSessionDayKey != null && daysBetweenDayKeys(lastSessionDayKey, todayKey) >= GAP_DAYS_FOR_EASE_BACK) {
    return { step: Math.max(0, prevStep - 1), stepSessions: 0, easedBack: true };
  }
  const stepSessions = prevStepSessions + 1;
  if (stepSessions >= SESSIONS_PER_STEP) {
    return { step: Math.min(MAX_STEP, prevStep + 1), stepSessions: 0, easedBack: false };
  }
  return { step: prevStep, stepSessions, easedBack: false };
}

/**
 * True when recent resting check-ins hold at/below the terminal pace:
 * at least 2 check-ins on distinct days in the last 7 days, all at or
 * below target.
 *
 * Note: for goal level 1 the terminal pace is 11/min, so every step
 * prescribes the same pace — progression there comes from the technique
 * unlocks, not from a slowing pace.
 */
export function goalHeldForWeek(
  checkins: RestingCheckin[],
  terminalBpm: number,
  today: Date = new Date(),
): boolean {
  const todayKey = dayKeyOf(today);
  const days = new Set(
    checkins
      .filter((c) => daysBetweenDayKeys(c.dayKey, todayKey) <= 7)
      .map((c) => c.dayKey),
  );
  const recent = checkins.filter((c) => days.has(c.dayKey));
  return days.size >= 2 && recent.every((c) => c.bpm <= terminalBpm);
}

/** Today's date as a day key. */
export function todayKey(): string {
  return dayKeyOf(new Date());
}

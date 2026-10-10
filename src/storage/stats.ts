import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'breathing-pacer:stats:v1';
const SETTINGS_KEY = 'breathing-pacer:settings:v1';
const CHECKINS_KEY = 'breathing-pacer:checkins:v1';
const CONTROL_PAUSES_KEY = 'breathing-pacer:controlpauses:v1';
const ACHIEVEMENTS_KEY = 'breathing-pacer:achievements:v1';
const ONBOARDING_KEY = 'breathing-pacer:onboarding:v1';

export interface SessionRecord {
  id: string;
  dateISO: string;
  dayKey: string;
  presetId: string;
  minutes: number;
  breaths: number;
  calm: number | null;
}

export interface Stats {
  totalSessions: number;
  totalMinutes: number;
  totalBreaths: number;
  streakDays: number;
  lastSessionDay: string | null;
  history: SessionRecord[];
}

export interface Settings {
  soundOn: boolean;
  /** The user's chosen goal, 1–4. Set in onboarding, changeable in Progress.
   *  Wired to the program: the terminal pace is 11/10/9/8 breaths a minute. */
  goalLevel: 1 | 2 | 3 | 4 | null;
  /** Day key the program started. Kept for older installs; pacing is
   *  now session-based (see programStep). */
  programStartDay: string | null;
  /** Program step 0–3. Advances every 7 completed sessions. */
  programStep: number;
  /** Completed sessions at the current step. */
  programStepSessions: number;
  /** A one-line note for Home, e.g. after easing back in. Cleared on read. */
  programNote: string | null;
  /** True once resting check-ins held at/below the goal pace for a week. */
  goalAchieved: boolean;
  /** The goal-achieved acknowledgment has been shown. */
  goalAckShown: boolean;
  /** Daily practice reminder. */
  reminderOn: boolean;
  /** 24-hour clock. */
  reminderHour: number;
  reminderMinute: number;
  /** UI appearance mode: system, light (ivory), or dark (nocturnal). */
  themeMode: 'system' | 'light' | 'dark';
  /** Optional traditional aspiration, levels 5-12. Display-only: the
   *  program always trains toward the goalLevel pace (floor 8/min). */
  aspirationLevel: number | null;
}

const EMPTY_STATS: Stats = {
  totalSessions: 0,
  totalMinutes: 0,
  totalBreaths: 0,
  streakDays: 0,
  lastSessionDay: null,
  history: [],
};

const DEFAULT_SETTINGS: Settings = {
  soundOn: true,
  goalLevel: null,
  programStartDay: null,
  programStep: 0,
  programStepSessions: 0,
  programNote: null,
  goalAchieved: false,
  goalAckShown: false,
  reminderOn: false,
  reminderHour: 8,
  reminderMinute: 0,
  themeMode: 'system',
  aspirationLevel: null,
};

export function dayKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days between two day keys (b - a). */
export function daysBetweenDayKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad);
  const db = new Date(by, bm - 1, bd);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function yesterdayKeyOf(date: Date): string {
  const y = new Date(date);
  y.setDate(y.getDate() - 1);
  return dayKeyOf(y);
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

export async function loadStats(): Promise<Stats> {
  const stats = await readJson<Stats>(STATS_KEY, EMPTY_STATS);
  if (!Array.isArray(stats.history)) stats.history = [];
  return stats;
}

export async function loadSettings(): Promise<Settings> {
  return readJson<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

/** Merge a partial update into the stored settings. Returns the result. */
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

/* ------------------------------------------------------------------ */
/* Onboarding — first-launch goal choice. The goal level itself lives   */
/* in Settings (changeable later from Progress); this only records     */
/* whether the intro was completed.                                    */
/* ------------------------------------------------------------------ */

export async function loadOnboardingDone(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as { done?: boolean }).done === true;
  } catch {
    return false;
  }
}

export async function saveOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ done: true }));
}

export interface RecordSessionInput {
  presetId: string;
  minutes: number;
  breaths: number;
  calm: number | null;
}

/** Persist a finished session and update totals + day streak. Returns updated stats. */
export async function recordSession(input: RecordSessionInput): Promise<Stats> {
  const stats = await loadStats();
  const now = new Date();
  const dayKey = dayKeyOf(now);

  let streakDays = stats.streakDays;
  if (stats.lastSessionDay !== dayKey) {
    streakDays = stats.lastSessionDay === yesterdayKeyOf(now) ? stats.streakDays + 1 : 1;
  }

  const record: SessionRecord = {
    id: `${now.getTime()}`,
    dateISO: now.toISOString(),
    dayKey,
    presetId: input.presetId,
    minutes: input.minutes,
    breaths: input.breaths,
    calm: input.calm,
  };

  const next: Stats = {
    totalSessions: stats.totalSessions + 1,
    totalMinutes: stats.totalMinutes + input.minutes,
    totalBreaths: stats.totalBreaths + input.breaths,
    streakDays,
    lastSessionDay: dayKey,
    history: [record, ...stats.history].slice(0, 60),
  };

  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next));
  return next;
}

/**
 * Remove one session and recompute totals + streak from what remains.
 * The streak counts consecutive practice days ending at the most recent
 * remaining session. Program step progress is left untouched: a deleted
 * session keeps whatever step advancement it already earned.
 */
export async function deleteSession(id: string): Promise<Stats> {
  const stats = await loadStats();
  const history = stats.history.filter((r) => r.id !== id);
  const days = [...new Set(history.map((r) => r.dayKey))].sort().reverse();
  let streakDays = 0;
  for (let i = 0; i < days.length; i++) {
    if (i === 0 || daysBetweenDayKeys(days[i], days[i - 1]) === 1) streakDays += 1;
    else break;
  }
  const next: Stats = {
    totalSessions: history.length,
    totalMinutes: history.reduce((a, r) => a + r.minutes, 0),
    totalBreaths: history.reduce((a, r) => a + r.breaths, 0),
    streakDays,
    lastSessionDay: days[0] ?? null,
    history: history.slice(0, 60),
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next));
  return next;
}

/**
 * Start over: clear sessions, check-ins, control pauses, and achievements,
 * and reset program progress. The goal, aspiration, reminder, and theme stay.
 */
export async function resetProgress(): Promise<Settings> {
  await AsyncStorage.multiRemove([STATS_KEY, CHECKINS_KEY, CONTROL_PAUSES_KEY, ACHIEVEMENTS_KEY]);
  return saveSettings({
    programStartDay: dayKeyOf(new Date()),
    programStep: 0,
    programStepSessions: 0,
    programNote: null,
    goalAchieved: false,
    goalAckShown: false,
  });
}

/* ------------------------------------------------------------------ */
/* Resting check-ins — manual logging of resting breaths/min.
 * Measured with the in-app 60-second guided timer (see Progress). */
/* ------------------------------------------------------------------ */

export interface RestingCheckin {
  id: string;
  dateISO: string;
  dayKey: string;
  /** Resting breaths per minute, counted over 60 seconds. */
  bpm: number;
}

const MAX_CHECKINS = 90;

export async function loadCheckins(): Promise<RestingCheckin[]> {
  try {
    const raw = await AsyncStorage.getItem(CHECKINS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RestingCheckin[];
    if (!Array.isArray(list)) return [];
    return list
      .filter((c) => typeof c?.bpm === 'number')
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
      .slice(0, MAX_CHECKINS);
  } catch {
    return [];
  }
}

/** Log a resting check-in. Returns the updated list, newest first. */
export async function logCheckin(bpm: number): Promise<RestingCheckin[]> {
  const list = await loadCheckins();
  const now = new Date();
  const entry: RestingCheckin = {
    id: `${now.getTime()}`,
    dateISO: now.toISOString(),
    dayKey: dayKeyOf(now),
    bpm: Math.max(1, Math.round(bpm)),
  };
  const next = [entry, ...list].slice(0, MAX_CHECKINS);
  await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(next));
  return next;
}

/* ------------------------------------------------------------------ */
/* Control pauses — the standard Buteyko progress metric, alongside     */
/* the resting check-in. Hold after a gentle exhale until the FIRST     */
/* urge to breathe (never to gasping), then log the seconds.            */
/* ------------------------------------------------------------------ */

export interface ControlPause {
  id: string;
  dateISO: string;
  dayKey: string;
  /** Seconds held to the first urge to breathe. */
  seconds: number;
}

const MAX_PAUSES = 90;

export async function loadControlPauses(): Promise<ControlPause[]> {
  try {
    const raw = await AsyncStorage.getItem(CONTROL_PAUSES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ControlPause[];
    if (!Array.isArray(list)) return [];
    return list
      .filter((p) => typeof p?.seconds === 'number')
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
      .slice(0, MAX_PAUSES);
  } catch {
    return [];
  }
}

/** Log a control pause. Returns the updated list, newest first. */
export async function logControlPause(seconds: number): Promise<ControlPause[]> {
  const list = await loadControlPauses();
  const now = new Date();
  const entry: ControlPause = {
    id: `${now.getTime()}`,
    dateISO: now.toISOString(),
    dayKey: dayKeyOf(now),
    seconds: Math.max(1, Math.round(seconds)),
  };
  const next = [entry, ...list].slice(0, MAX_PAUSES);
  await AsyncStorage.setItem(CONTROL_PAUSES_KEY, JSON.stringify(next));
  return next;
}

/**
 * Reference ranges for the control pause, from the breathwork community.
 * These are not clinical cutoffs — just a way to read your trend.
 * A progress metric, not a medical grade.
 */
export function controlPauseBand(seconds: number): { range: string } {
  if (seconds < 20) return { range: 'under 20s' };
  if (seconds < 30) return { range: '20–30s' };
  if (seconds < 40) return { range: '30–40s' };
  return { range: 'over 40s' };
}

/* ------------------------------------------------------------------ */
/* Achievements — a small, editorially named set. Stored as unlocked    */
/* ids with dates; the definitions live in src/data/achievements.ts.    */
/* ------------------------------------------------------------------ */

export interface AchievementUnlock {
  id: string;
  dateISO: string;
}

export async function loadAchievements(): Promise<AchievementUnlock[]> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as AchievementUnlock[];
    if (!Array.isArray(list)) return [];
    return list.filter((a) => typeof a?.id === 'string');
  } catch {
    return [];
  }
}

/**
 * Unlock any of the candidate ids not already unlocked.
 * Returns the full list and the ids unlocked by this call.
 */
export async function unlockAchievements(
  candidateIds: string[],
): Promise<{ all: AchievementUnlock[]; newly: string[] }> {
  const current = await loadAchievements();
  const have = new Set(current.map((a) => a.id));
  const newly = candidateIds.filter((id) => !have.has(id));
  if (newly.length === 0) return { all: current, newly: [] };
  const now = new Date().toISOString();
  const all = [...current, ...newly.map((id) => ({ id, dateISO: now }))];
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(all));
  return { all, newly };
}

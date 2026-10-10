import { useCallback, useEffect, useRef, useState } from 'react';
import type { PhaseDef, RhythmPreset, SessionDuration } from '../data/presets';

export type EngineStatus = 'idle' | 'settle' | 'running' | 'paused' | 'done';

export interface EngineSnapshot {
  status: EngineStatus;
  /** Index of the current phase within the preset. */
  phaseIndex: number;
  phase: PhaseDef;
  /** Increments on every phase change (and when running starts); drives animations + the guiding hum. */
  phaseToken: number;
  /** Whole seconds remaining in the current phase. */
  phaseRemainingSec: number;
  /**
   * Effective seconds of the current phase after ramp adjustment.
   * Drives the bloom animation duration so visuals stay synced.
   */
  phaseSecondsEff: number;
  /** Whole seconds remaining in the settle-in countdown. */
  settleRemainingSec: number;
  /** Whole seconds elapsed in the session. */
  totalElapsedSec: number;
  /** Whole seconds remaining in the session; null for open-ended sessions. */
  totalRemainingSec: number | null;
  /** Full breath cycles completed. */
  breathsCompleted: number;
  /** Target breath count for 'breaths' mode; null otherwise. */
  breathsTarget: number | null;
}

export interface EngineCallbacks {
  onPhaseChange?: (phase: PhaseDef, phaseIndex: number) => void;
  onComplete?: (breaths: number, elapsedSec: number) => void;
}

export interface EngineOptions {
  /** Warm-up: interpolate phase lengths from 70% up to full across the first 8 breaths. */
  ramp?: boolean;
  /** Settle-in countdown seconds before the first inhale. 0 disables. */
  settleSec?: number;
}

const TICK_MS = 100;
const RAMP_START = 0.7;
const RAMP_BREATHS = 8;

function rampFactor(breathIndex: number, ramp: boolean): number {
  if (!ramp) return 1;
  return RAMP_START + (1 - RAMP_START) * (Math.min(breathIndex, RAMP_BREATHS) / RAMP_BREATHS);
}

function makeSnapshot(
  status: EngineStatus,
  preset: RhythmPreset,
  duration: SessionDuration,
  opts: Required<EngineOptions>,
  phaseIndex: number,
  phaseToken: number,
  phaseAccumMs: number,
  totalAccumMs: number,
  breathsCompleted: number,
  settleAccumMs: number,
): EngineSnapshot {
  // Defensive: a preset with no phases (all custom phases at 0s) is
  // rejected by the setup screen, but never let the engine crash on it.
  const safePhases: PhaseDef[] =
    preset.phases.length > 0
      ? preset.phases
      : [{ key: 'inhale', label: 'Breathe in', seconds: 1 }];
  const phase = safePhases[Math.min(phaseIndex, safePhases.length - 1)];
  const effMs = phase.seconds * 1000 * rampFactor(breathsCompleted, opts.ramp);
  const phaseRemainingMs = Math.max(0, effMs - phaseAccumMs);
  const settleMs = opts.settleSec * 1000;

  const durationMs = duration.mode === 'minutes' ? (duration.minutes ?? 5) * 60 * 1000 : null;
  const breathsTarget = duration.mode === 'breaths' ? (duration.breaths ?? 20) : null;

  return {
    status,
    phaseIndex,
    phase,
    phaseToken,
    phaseRemainingSec: Math.ceil(phaseRemainingMs / 1000),
    phaseSecondsEff: Math.max(0.1, effMs / 1000),
    settleRemainingSec: Math.ceil(Math.max(0, settleMs - settleAccumMs) / 1000),
    totalElapsedSec: Math.floor(totalAccumMs / 1000),
    totalRemainingSec:
      durationMs == null ? null : Math.max(0, Math.ceil((durationMs - totalAccumMs) / 1000)),
    breathsCompleted,
    breathsTarget,
  };
}

/**
 * Accurate breath-session state machine.
 *
 * Timing is derived from wall-clock timestamps (Date.now) rather than
 * counting interval ticks, so phases stay accurate even if the JS thread
 * is briefly busy. The interval only samples the clock.
 *
 * Pause freezes the clock: resume() resets the tick baseline, so the
 * breath continues mid-phase exactly where it stopped (epoch shift).
 */
export function useBreathEngine(
  preset: RhythmPreset,
  duration: SessionDuration,
  options: EngineOptions = {},
  callbacks: EngineCallbacks = {},
) {
  const opts: Required<EngineOptions> = {
    ramp: options.ramp ?? false,
    settleSec: options.settleSec ?? 3,
  };

  const statusRef = useRef<EngineStatus>('idle');
  const phaseIndexRef = useRef(0);
  const phaseTokenRef = useRef(0);
  const phaseAccumRef = useRef(0);
  const totalAccumRef = useRef(0);
  const breathsRef = useRef(0);
  const settleAccumRef = useRef(0);
  const lastTickRef = useRef(0);
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() =>
    makeSnapshot('idle', preset, duration, opts, 0, 0, 0, 0, 0, 0),
  );

  const push = useCallback(
    (status: EngineStatus) => {
      setSnapshot(
        makeSnapshot(
          status,
          preset,
          duration,
          opts,
          phaseIndexRef.current,
          phaseTokenRef.current,
          phaseAccumRef.current,
          totalAccumRef.current,
          breathsRef.current,
          settleAccumRef.current,
        ),
      );
    },
    // opts is rebuilt per render but its fields are stable for a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, duration.mode, duration.minutes, duration.breaths, opts.ramp, opts.settleSec],
  );

  const finish = useCallback(() => {
    statusRef.current = 'done';
    push('done');
    callbacksRef.current.onComplete?.(breathsRef.current, Math.round(totalAccumRef.current / 1000));
  }, [push]);

  const advancePhase = useCallback(() => {
    const nextIndex = (phaseIndexRef.current + 1) % preset.phases.length;
    if (nextIndex === 0) breathsRef.current += 1;
    phaseIndexRef.current = nextIndex;
    phaseTokenRef.current += 1;
    callbacksRef.current.onPhaseChange?.(preset.phases[nextIndex], nextIndex);
  }, [preset]);

  // Clock-sampling loop.
  useEffect(() => {
    const id = setInterval(() => {
      const status = statusRef.current;
      if (status !== 'running' && status !== 'settle') return;
      const now = Date.now();
      const dt = Math.max(0, now - lastTickRef.current);
      lastTickRef.current = now;

      if (status === 'settle') {
        settleAccumRef.current += dt;
        if (settleAccumRef.current >= opts.settleSec * 1000) {
          statusRef.current = 'running';
          phaseTokenRef.current += 1;
          push('running');
        } else {
          push('settle');
        }
        return;
      }

      phaseAccumRef.current += dt;
      totalAccumRef.current += dt;

      if (
        duration.mode === 'minutes' &&
        totalAccumRef.current >= (duration.minutes ?? 5) * 60 * 1000
      ) {
        finish();
        return;
      }

      // Carry overshoot into the next phase so timing never drifts.
      let guard = 0;
      while (preset.phases.length > 0 && guard++ < preset.phases.length + 1) {
        const effMs =
          preset.phases[phaseIndexRef.current].seconds *
          1000 *
          rampFactor(breathsRef.current, opts.ramp);
        if (phaseAccumRef.current < effMs) break;
        phaseAccumRef.current -= effMs;
        advancePhase();
        if (duration.mode === 'breaths' && breathsRef.current >= (duration.breaths ?? 20)) {
          finish();
          return;
        }
      }
      push('running');
    }, TICK_MS);
    return () => clearInterval(id);
  }, [preset, duration.mode, duration.minutes, duration.breaths, opts.ramp, opts.settleSec, advancePhase, finish, push]);

  const resetRefs = useCallback(() => {
    phaseIndexRef.current = 0;
    phaseTokenRef.current = 0;
    phaseAccumRef.current = 0;
    totalAccumRef.current = 0;
    breathsRef.current = 0;
    settleAccumRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (preset.phases.length === 0) return;
    resetRefs();
    statusRef.current = opts.settleSec > 0 ? 'settle' : 'running';
    if (statusRef.current === 'running') phaseTokenRef.current += 1;
    lastTickRef.current = Date.now();
    push(statusRef.current);
  }, [preset, opts.settleSec, push, resetRefs]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    statusRef.current = 'paused';
    push('paused');
  }, [push]);

  /** Pausing during the settle-in countdown cancels it back to idle. */
  const cancel = useCallback(() => {
    if (statusRef.current !== 'settle') return;
    statusRef.current = 'idle';
    resetRefs();
    push('idle');
  }, [push, resetRefs]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    statusRef.current = 'running';
    // Epoch shift: the paused interval is excluded from the clock,
    // so the breath resumes mid-phase exactly where it stopped.
    lastTickRef.current = Date.now();
    push('running');
  }, [push]);

  const reset = useCallback(() => {
    statusRef.current = 'idle';
    resetRefs();
    push('idle');
  }, [push, resetRefs]);

  return { snapshot, start, pause, resume, reset, cancel };
}

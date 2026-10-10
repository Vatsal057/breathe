import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import type { PhaseKey } from '../data/presets';

/**
 * The guiding voice: a real Om chant, one breath cycle per breath.
 *
 * The asset (assets/om-cycle.wav, built by scripts/make-om-cycle.py from the
 * CC-BY 4.0 "OM AUM MANTRA MALE CHANT Bb" recording by CarlosCarty —
 * https://freesound.org/people/CarlosCarty/sounds/522687/) holds one breath:
 * a soft inhale flowing into the Om chant on the exhale.
 *
 * How it works: at each inhale the chant plays once, stretched with
 * pitch-preserving rate so it always spans exactly one breath cycle — the
 * voice stays natural while the timing follows the session's pace
 * (5.5 s at 11 BPM up to 11.5 s in kumbhaka). Volume swells with the
 * breath-progress math (the same easing as the Bloom), so the voice feels
 * like it is breathing with you. Holds keep the chant playing through.
 */

const FADE_IN_MS = 2200;
const FADE_OUT_MS = 1400;
const TICK_MS = 100;

/** Length of the chant asset in seconds (scripts/make-om-cycle.py default). */
const CHANT_CYCLE_SEC = 6;

const easeOutSine = (t: number): number => Math.sin((t * Math.PI) / 2);
const easeInSine = (t: number): number => 1 - Math.cos((t * Math.PI) / 2);

/** Breath position target per phase — mirrors Bloom's targetFor. */
function targetFor(key: PhaseKey): number {
  if (key === 'inhale' || key === 'holdIn') return 1;
  return 0; // exhale, holdOut
}

interface PhaseLeg {
  key: PhaseKey;
  /** Effective phase length in ms. */
  durMs: number;
  /** Breath progress when this leg started. */
  startP: number;
  targetP: number;
  /** Timestamp the leg started. */
  t0: number;
}

class GuidingHum {
  private player: AudioPlayer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private enabled = true;
  private active = false; // a session is using the hum
  private leg: PhaseLeg | null = null;
  private pausedP = 0;
  private fadeInT0 = 0;
  private fadingOut = false;
  private fadeOutT0 = 0;
  /** The session wants audible hum right now (not paused, ended, or toggled off). */
  private expectPlaying = false;
  /** Actual breath-cycle seconds for this session; the chant is stretched to it. */
  private cycleSec = CHANT_CYCLE_SEC;

  async ensure(): Promise<void> {
    if (this.player) return;
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer(require('../../assets/om-cycle.wav'));
      // A voice, not a drone: keep the pitch natural when the rate changes.
      player.shouldCorrectPitch = true;
      player.volume = 0;
      this.player = player;
    } catch {
      this.player = null; // Audio is optional; sessions work without it.
    }
  }

  /** Current eased breath progress 0..1 from the active leg. */
  private progress(now: number): number {
    const leg = this.leg;
    if (!leg) return 0;
    if (leg.key === 'holdIn' || leg.key === 'holdOut') return leg.targetP;
    const t = Math.min(1, Math.max(0, (now - leg.t0) / Math.max(1, leg.durMs)));
    const e = leg.key === 'exhale' ? easeInSine(t) : easeOutSine(t);
    return leg.startP + (leg.targetP - leg.startP) * e;
  }

  private tick = (): void => {
    const player = this.player;
    if (!player || !this.active) return;
    // Self-heal: if the platform dropped playback mid-session, resume it.
    // Never fights an intentional pause, fade-out, or the user's toggle.
    if (!this.fadingOut && this.expectPlaying && !player.playing) {
      try {
        player.play();
      } catch {
        // ignore; retried on the next tick
      }
    }
    const now = Date.now();
    const p = this.progress(now);
    this.pausedP = p;

    let fade = 1;
    if (this.fadingOut) {
      fade = Math.max(0, 1 - (now - this.fadeOutT0) / FADE_OUT_MS);
      if (fade <= 0) {
        try {
          player.pause();
        } catch {
          // never break a session
        }
        this.stopTimer();
        this.active = false;
        this.fadingOut = false;
        return;
      }
    } else {
      fade = Math.min(1, (now - this.fadeInT0) / FADE_IN_MS);
    }

    // The chant carries the inhale/exhale feel itself; the volume swells
    // with the breath so it feels like it is breathing with you.
    const vol = this.enabled ? fade * (0.55 + 0.45 * p) : 0;
    try {
      player.volume = Math.max(0, Math.min(1, vol));
    } catch {
      // Never let a sound failure interrupt a session.
    }
  };

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(this.tick, TICK_MS);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Session is starting (called during the settle-in countdown). Arms the
   * voice; the first chant begins with the first inhale. Idempotent.
   */
  begin(cycleSec: number = CHANT_CYCLE_SEC): void {
    const player = this.player;
    if (!player) return;
    if (this.active && !this.fadingOut) return; // already running
    // A previous session's fade-out may still be in flight (quick restart
    // after ending): cancel it so the new session takes over cleanly instead
    // of the old fade silencing the new voice.
    this.active = true;
    this.fadingOut = false;
    this.expectPlaying = true;
    this.cycleSec = Math.max(2, cycleSec);
    this.leg = null;
    this.pausedP = 0;
    this.fadeInT0 = Date.now();
    this.startTimer();
    try {
      player.volume = 0;
    } catch {
      // ignore
    }
  }

  /** A new breath phase began. Starts one chant cycle on each inhale. */
  phaseChanged(key: PhaseKey, phaseSeconds: number): void {
    if (!this.active) return;
    const player = this.player;
    const targetP = targetFor(key);
    this.leg = {
      key,
      durMs: Math.max(200, phaseSeconds * 1000),
      startP: this.pausedP,
      targetP,
      t0: Date.now(),
    };
    if (key === 'inhale' && player) {
      // Stretch the 6 s chant to this breath's length, voice kept natural.
      const rate = CHANT_CYCLE_SEC / this.cycleSec;
      try {
        if (Platform.OS === 'web') {
          player.setPlaybackRate(rate, 'high'); // preservesPitch = true
        } else {
          player.shouldCorrectPitch = true;
          player.playbackRate = rate;
        }
        player.volume = 0;
        // Restart from the top; play after the seek resolves so we never
        // race it and clip the inhale.
        void player.seekTo(0).then(() => {
          if (!this.active || this.fadingOut || !this.expectPlaying) return;
          try {
            player.play();
          } catch {
            // ignore; the tick watchdog retries
          }
        });
      } catch {
        // ignore; the tick watchdog retries
      }
    }
  }

  /** Pause: freeze the voice with the clock. */
  onPause(): void {
    if (!this.active) return;
    this.expectPlaying = false;
    this.tick(); // capture the exact progress at the pause instant
    this.stopTimer();
    try {
      this.player?.pause();
    } catch {
      // ignore
    }
  }

  /** Resume: continue mid-breath exactly where it stopped. */
  onResume(): void {
    const player = this.player;
    if (!player || !this.active || !this.leg) return;
    this.expectPlaying = true;
    const remaining = Math.abs(this.leg.targetP - this.pausedP) * this.leg.durMs;
    this.leg = {
      ...this.leg,
      startP: this.pausedP,
      durMs: Math.max(200, remaining),
      t0: Date.now(),
    };
    this.startTimer();
    try {
      player.play();
    } catch {
      // ignore
    }
  }

  /** Session finished or ended: gentle fade-out, then stop. */
  end(): void {
    if (!this.active || !this.player) return;
    this.expectPlaying = false;
    this.fadingOut = true;
    this.fadeOutT0 = Date.now();
    // The tick loop finishes the fade and stops the player.
  }

  /** User toggled the guiding voice off/on. */
  setEnabled(on: boolean): void {
    this.enabled = on;
    const player = this.player;
    if (!player) return;
    if (!on) {
      if (!this.active) return;
      // Quick fade to silence, keep the session state intact.
      this.expectPlaying = false;
      this.fadingOut = true;
      this.fadeOutT0 = Date.now() - FADE_OUT_MS / 2;
      return;
    }
    this.expectPlaying = true;
    if (!this.active) {
      // Fully stopped earlier (the fade finished while toggled off): restart
      // cleanly, keeping the current breath leg so the volume continues
      // mid-breath instead of jumping.
      this.active = true;
      this.fadeInT0 = Date.now() - FADE_IN_MS / 2; // resume near full volume
      this.startTimer();
      try {
        player.play();
      } catch {
        // ignore
      }
      return;
    }
    this.fadingOut = false;
    try {
      player.play();
    } catch {
      // ignore
    }
    this.fadeInT0 = Date.now() - FADE_IN_MS / 2; // resume near full volume
    this.startTimer();
  }

  /** Full teardown (screen unmount). */
  dispose(): void {
    this.stopTimer();
    this.active = false;
    this.expectPlaying = false;
    try {
      this.player?.release();
    } catch {
      // ignore
    }
    this.player = null;
  }
}

/** Singleton: one guiding voice for the session screen. */
export const hum = new GuidingHum();

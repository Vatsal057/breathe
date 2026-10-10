# Breathe

> Shiva Svarodaya breathwork and Angul prana training app built with React Native and Expo.

[![CI](https://github.com/Vatsal057/breathe/actions/workflows/ci.yml/badge.svg)](https://github.com/Vatsal057/breathe/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020.svg)](https://expo.dev)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg)](https://reactnative.dev)

Breathe is a slow-breathing pacer designed around the breath-reduction principles of the *Shiva Svarodaya*—an ancient yogic text on prana dynamics. Rather than using arbitrary timers, it provides a progressive program to gradually lower resting respiratory rate toward deliberate targets (from 11 down to 8 breaths per minute) while tracking physiological breath hold capacity.

The app is completely offline-first, private, and carries no gamified scoreboards or telemetry.

## Features

- **Progressive Breathwork Program**: 7-session progressive stages that gently step down breath frequency by 1 breath/min per stage, with built-in regression safety if a practitioner pauses practice for a week.
- **Visual Bloom Pacer**: A full-screen organic flower animation that blooms on inhale and recedes on exhale, calibrated with easing curves matching human lung volume expansion.
- **Adaptive Om Chant & Drone Guidance**: Stretches a real vocal Om chant per breath cycle (`assets/om-cycle.wav`) preserving natural acoustic timbre across speeds, paired with a harmonic drone option.
- **Guided Control Pause Measurement**: Measures unforced respiratory reserve (the delay before the first involuntary urge to inhale after a passive exhale), tracking respiratory health trends without forced breath-holding.
- **Traditional Technique Library**: Dedicated modules for Paced Breathing, Ujjayi, Nadi Shodhana (with active left/right nostril cues), and Kumbhaka (with explicit safety parameters).
- **12-Level Angul Map**: A contextual reading guide to traditional texts describing breath span reduction from 12 anguls (finger-widths) down to 4 anguls.
- **Offline Local Storage**: Session counts, streaks, calm ratings, and test logs persist on-device via AsyncStorage.
- **Local Daily Reminders**: Notification schedules managed entirely on-device via `expo-notifications` with zero remote servers or tracking.

## Quick Start

### Prerequisites

- Node.js 20 or later
- npm
- [Expo Go](https://expo.dev/go) on your iOS or Android device

### Installation & Run

```bash
git clone https://github.com/Vatsal057/breathe.git
cd breathe
npm install
npx expo start
```

Scan the terminal QR code with the Expo Go app on your phone (or press `a` for Android emulator, `i` for iOS simulator).

## Verification & Scripts

```bash
npx tsc --noEmit        # Run strict TypeScript typecheck
npx expo lint           # Run ESLint validation
node scripts/gen-drone.js assets                       # Re-generate synthetic harmonic drone
python3 scripts/make-om-cycle.py assets/om-chant-full.wav assets/om-cycle.wav  # Build breath-cycle chant
```

## How It Works

### The Angul Framework

In the *Shiva Svarodaya*, the physical distance breath travels outward from the nostrils is measured in *anguls* (finger-widths). In normal states, exhalation extends approximately 12 anguls. Through steady, relaxed cultivation of deeper, slower breathing and natural kumbhaka (retention), that distance shortens toward 4 anguls:

| Span | Traditional State | Modern Practice Parallel |
|---|---|---|
| 12 anguls | Normal waking breath (~15–18 BPM) | Baseline |
| 10–9 anguls | Calm contemplation (~10–12 BPM) | Slow paced breathing |
| 8–7 anguls | Steady concentration (~6–8 BPM) | Resonance frequency |
| 6–4 anguls | Deep meditative absorption | Extended natural hold |

The app treats this scale as reflective traditional literature rather than an arbitrary game score.

## Architecture

- **Engine** (`src/engine/useBreathEngine.ts`): Accurate timer loop decoupling frame render rates from breathing cadence, with pause-and-resume state preservation.
- **Audio** (`src/audio/hum.ts`): Pitch-preserving rate adjustments powered by `expo-audio` providing real-time acoustic feedback.
- **Navigation** (`src/navigation/types.ts`): Native stack and bottom tab architecture using React Navigation.
- **Storage** (`src/storage/stats.ts`): Fully local key-value store wrapper with zero third-party cloud sync.

## Contributing

Contributions are welcome. Please check [CONTRIBUTING.md](CONTRIBUTING.md) for local development workflows and guidelines.

## License

This project is licensed under the [MIT License](LICENSE).

### Audio Attribution

The guiding Om chant is derived from "OM AUM MANTRA MALE CHANT Bb" by CarlosCarty, licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). See the in-app attribution under Progress settings.

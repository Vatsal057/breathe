# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-11

### Added
- **Core Breath Engine**: Adaptive pacing engine supporting custom phase durations (inhale, holdIn, exhale, holdOut).
- **Session Screen**: Full-screen flower Bloom visual animation with real-time countdown, touch-to-pause, and phase guidance.
- **Acoustic Feedback**: Natural Om chant guidance stretched per breath cycle (`assets/om-cycle.wav`) alongside local harmonic drone audio.
- **Technique Library & Learn Tab**: Interactive guide for 5 traditional practices (Paced Breathing, Ujjayi, Nadi Shodhana, Kumbhaka, and Thread Test) with safety guidance.
- **Control Pause Measurement**: Guided test to assess resting respiratory tolerance without forcing or breath-holding competition.
- **Angul Journey & Map**: 12-level reference map grounded in Shiva Svarodaya teachings.
- **Aspiration Selector**: Optional traditional aspiration display selector (Levels 5–12) for dedicated practitioners.
- **Progress & History**: Offline local storage using `@react-native-async-storage/async-storage` with streak tracking and milestone stamps.
- **Daily Practice Reminders**: Local scheduled notifications via `expo-notifications` operating fully offline.
- **Comprehensive Documentation**: PRD, Technical Requirements (TRD), architecture decisions, and audit logs under `docs/`.

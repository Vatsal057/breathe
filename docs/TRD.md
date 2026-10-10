# TRD — Breath Pacer

## 1. Stack

- Expo SDK 57, React Native 0.86, React 19, strict TypeScript.
- React Navigation: native stack + bottom tabs. (Note: the project AGENTS.md
  says Expo Router — outdated. The app uses React Navigation; see audit 1.8.)
- No backend. All state in AsyncStorage.
- npm (not bun). Verify with `npx tsc --noEmit`, `npx expo lint`,
  `npx expo-doctor`.

## 2. Architecture map

```
App.tsx                  Root: fonts, theme, onboarding gate, tab + stack nav
src/theme.ts             Theme tokens (Vibrant Ivory / Nocturnal Ember), fonts
src/navigation/types.ts  TabParamList, RootStackParamList, SessionTechniqueId
src/screens/            8 screens (below)
src/components/         UI primitives (ui.tsx), icons, Bloom, BackdropBloom,
                         GrainOverlay, OrnamentDivider, WatermarkNumeral,
                         AtmagyanConduit, AngulSpanGauge, TechniqueDeck pieces,
                         AspirationSelector
src/data/               Pure data + pure logic: presets, program, levels,
                         angul, techniques, achievements, verses
src/engine/             useBreathEngine — wall-clock phase machine
src/audio/              hum — synthesized guiding drone
src/storage/            stats — AsyncStorage: stats, settings, check-ins,
                         control pauses, achievements, onboarding flag
src/notifications/      reminders — daily local notification
```

Screens: OnboardingScreen, HomeScreen, SessionScreen, CompleteScreen,
MeasureScreen, MapScreen, ProgressScreen, LearnScreen.

## 3. Navigation map

Tabs (labels): Practice (Home), Journey (Map), Depth (Progress), Learn.
Stack: Main (tabs) → Session (`gestureEnabled: false`) → Complete; Measure
from Progress. Session takes `{ targetBpm, step, minutes, techniqueId? }`;
Complete takes the same plus `{ breaths, elapsedSec }` and forwards
`techniqueId` on "Breathe Again".

## 4. Data model (AsyncStorage, all keys `breathing-pacer:*:v1`)

- **Settings**: soundOn, goalLevel (1|2|3|4|null), programStartDay, programStep
  (0–3), programStepSessions, programNote (cleared on Home focus),
  goalAchieved, goalAckShown, reminderOn, reminderHour, reminderMinute,
  themeMode ('system'|'light'|'dark'), aspirationLevel (number|null,
  display-only).
- **Stats**: totalSessions, totalMinutes, totalBreaths, streakDays,
  lastSessionDay, history (last 60 SessionRecords).
- **SessionRecord**: id, dateISO, dayKey, presetId ('program'|'nadi'|
  'kumbhaka'), minutes (from elapsed wall time), breaths, calm (1–5|null).
- **RestingCheckin**: id, dateISO, dayKey, bpm. **ControlPause**: same shape
  with seconds. **AchievementUnlock**: id, dateISO.
- `readJson` shallow-merges stored JSON over defaults, so new Settings fields
  need no migration.

## 5. Program math (`src/data/program.ts`)

- `terminalBpmForGoal(level)` = 12 − level → 11/10/9/8.
- `targetBpmForStep(step, terminal)` = max(terminal, 11 − clamp(step, 0, 3)).
- `effectiveProgram(restingBpm, step, terminal)`: advances one step early if
  the latest check-in beats the next step's target.
- `programStepAfterSession`: +1 session; every 7th completes the step
  (capped at step 3); a 7+ day gap eases back one step with `easedBack`.
- `goalHeldForWeek`: 2+ check-ins within 7 days, all ≤ terminal → maintenance
  (5-minute sessions).
- Presets (`src/data/presets.ts`): 40% inhale / 60% exhale, no holds;
  kumbhaka adds a fixed 4s holdIn; nadi reuses the pacer shape with its own
  id for honest history labels.

## 6. Session engine (`src/engine/useBreathEngine.ts`)

Wall-clock phase machine over inhale/holdIn/exhale/holdOut. 3s settle,
pause resumes mid-phase, backgrounding auto-pauses. Completion fires
`onComplete(breaths, elapsedSec)`; early exit records nothing (see audit
2.3). The nadi L/R indicator is derived in SessionScreen from
`breathsCompleted` parity — presentation only, no engine changes.

## 7. Audio (`src/audio/hum.ts`)

Continuously synthesized drone (no audio assets at runtime). Pitch follows
breath progress: rises on inhale, falls on exhale, frozen during holds.
`ensure` / `setEnabled` / `begin` / `phaseChanged` / `onPause` / `onResume` /
`end` / `dispose`. Toggle in Progress settings.

## 8. Notifications (`src/notifications/reminders.ts`)

Local daily notification at the user's time, streak-aware one-line copy.
The bare `import './src/notifications/reminders'` in App.tsx registers the
foreground notification handler at startup. Cancel-then-schedule makes
repeated calls idempotent.

## 9. Theming

`ThemeProvider` with light (Vibrant Ivory) and dark (Nocturnal Ember)
palettes; Fraunces 400/600; single coral accent; hairline borders; film
grain overlay (`pointerEvents="none"`); 8-petal Bloom watermark. Note the
audit 1.7 issue: app.json forces light OS chrome.

## 10. Working conventions

- The build machine is the owner's Mac; access is file-only. The owner runs
  all commands (`npx tsc --noEmit`, `npx expo lint`, `npx expo start`).
- Strict TS + lint must pass before calling work done.
- Standing rule: convene the pro software developer + UI designer council
  (subagents) before any app change, and always get their take on the hook.

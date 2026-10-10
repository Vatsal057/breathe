# Audit — Breath Pacer (`breathe`)

Date: 2026-10-10. Scope: the whole app — every screen, component, data module,
engine, audio, storage, notifications, navigation, configs, and docs.
Method: fresh read of every file changed in the recent techniques/learn/aspiration
work, plus spot verification of everything else.

Severity: [High] = honesty, safety, or crash risk, or contradicts the product's
own rules. [Medium] = real inconsistency or gap that confuses users or future
developers. [Low] = dead code, polish, nice-to-haves.

---

## 1. Inconsistencies

### 1.1 The gauge presents the angul-to-BPM mapping as fact [High]

`src/components/AngulSpanGauge.tsx`:

- Subtitle: "Shiv Swarodaya: 12 anguls natural exhale → 8 anguls stilled"
- Labels: "8 Angul / Vak Siddhi (≤8 BPM)", badge "−4 Angul Goal"
- Explainer: "Target: ≤X BPM to anchor the 4-angul inward stillness."

This is the 1:1 invented scoring an earlier council removed from the program
logic, still alive in the UI. The app's honesty rule (README, onboarding,
Learn) says only resting breath rate is measured and siddhis are tradition,
not promises. The gauge breaks that rule on the home screen.

It also ignores the user's goal: for goalLevel 1 (target 11 BPM) the gauge
still shows "−4 Angul Goal" and "4-angul inward stillness", which is wrong
for that user.

Fix options: reframe the gauge around the user's own target, or tag it
clearly as the traditional map.

### 1.2 Stale header and dead plumbing in presets.ts [Low]

- The file header still says "The ONE method"; there are now three session
  builders (program, nadi, kumbhaka).
- `resolvePreset` and the `SessionConfig` interface have no callers since
  SessionScreen builds presets directly from `techniqueId`.

### 1.3 `src/data/why.ts` is dead code [Low]

WHY_CARDS has no importers since WhyScreen was deleted. The Learn basics
deck carries the same ideas in shorter form. Delete the file or rewire it.

### 1.4 Home badge and technique line can disagree [Medium]

- The badge uses the *effective* program step, which can advance a step early
  on a good resting check-in.
- The technique line and the actual session use the *stored* step.

After an early advance the badge can read "Step 3 of 4" while the session
still runs paced breathing at the stored step's technique.

### 1.5 Unlock celebrations render in danger red [Medium]

`HomeScreen.tsx` renders `programNote` in `colors.danger` for both the
ease-back warning (correct tone) and the "Step N reached · X unlocked"
celebration (wrong tone). Split the styling by note kind.

### 1.6 Three product names [Low]

- package.json: "breathing-pacer-app"
- app.json: "Breath Pacer"
- In-app headers: "Prana Pacer"

Pick one store-facing name and keep the others as code labels only.

### 1.7 app.json forces light OS chrome [Medium]

`userInterfaceStyle: "light"` while the app ships a full dark theme and a
theme picker. The in-app theme works, but the OS-level chrome stays light.

### 1.8 Project AGENTS.md contradicts the stack [Medium]

It mandates Expo Router and `bunx`; the app uses React Navigation and npm.
Any new contributor or agent following AGENTS.md will scaffold the wrong
thing. Update it to describe the actual stack.

### 1.9 Kumbhaka pace label is not the practiced pace [Medium]

The session pill and the Complete screen's "BPM Pace" show the program
target (8) for kumbhaka sessions, but the actual cycle (3s inhale + 4s hold
+ 4.5s exhale) is about 5.2 breaths/min. The number on screen is the program
pace, not the practiced pace. Label it honestly or show the real number.

### 1.10 Goal-1 program never changes pace [Medium]

For goalLevel 1 (terminal 11 BPM), `targetBpmForStep` returns 11 at every
step. The 28-session "program" is 11 BPM throughout; only the techniques
change. Undocumented, and the onboarding line "7 sessions per step, slower
each step" is false for these users.

### 1.11 Unsubstantiated outcome claims [High]

- Onboarding "What actually changes": "Noticeable in the first two weeks",
  "Most people see it drop by week six to eight".
- CompleteScreen 14-day milestone: "Vagal tone deepens."

Stated as facts. The honesty contract says only measured outcomes are
promised. Soften to what is actually known or tag as typical, not certain.

### 1.12 Traditional fruits presented as outcomes in the picker [High]

`src/data/levels.ts` fruit/meaning lines ("Unconditional Bliss", "Every
word spoken carries weight, stillness, and deliberate authority") appear on
the goal picker cards with no "traditional claim" framing. The Map screen
tags the same ideas as tradition; the picker does not. Add the tag or
reword to plain physiological language.

### 1.13 Verse translations lack provenance [Medium]

HomeScreen presents three Sanskrit verses as Shiv Swarodaya quotes with
English translations, but the translations are the app's own and no source
is cited in-app. Either cite or soften the attribution.

### 1.14 Verse ranges cited inconsistently [Low]

- angul.ts: vv. 216–222. MapScreen horizons: vv. 220–222. presets.ts header:
  measurements vv. 216–218, table vv. 219–222. Pick one citation scheme.

---

## 2. Ambiguities

### 2.1 "8-week program" vs session counting [Medium]

The journey doc, README, and onboarding use calendar language ("8-week",
"week six to eight") but advancement is purely session-counted (7 per step,
28 minimum). Two sessions a day finishes the steps in two weeks; three a
week takes over two months. The time language is illustrative, not real.

### 2.2 goalHeldForWeek counts same-day check-ins [Low]

Two check-ins logged minutes apart satisfy "held for a week". Harmless in
practice, but the name overpromises. Either require distinct days or rename.

### 2.3 Early exit discards the session silently [Medium]

Exit / End Session Early navigates away without recording. A 9-minute
session counts for nothing and the user is never told. Either grant partial
credit or say plainly "this session won't be recorded".

### 2.4 Ujjayi cue resets every session [Low]

The toggle is session-local and defaults on when unlocked. Turning it off
lasts one session. Probably fine; undocumented.

### 2.5 No sessions-remaining indicator [Medium]

Home never shows progress within a step ("3 sessions left in this step").
The user can only infer it by counting history rows.

### 2.6 Nadi shodhana is the simplified form [Low]

Traditional nadi shodhana includes retention; the app's version is
inhale/exhale only. The Learn page doesn't say it's simplified.

### 2.7 'Sahaja pranayama' label [Low]

`techniques.ts` labels paced breathing 'सहज प्राणायाम'. Reasonable, but it
is the app's own naming, not a cited source.

---

## 3. Missing

- **M1 [Medium] Program restart / data reset.** No way to start over short
  of reinstalling the app.
- **M2 [Medium] History deletion.** No way to remove a mis-recorded session.
- **M3 [Low] Onboarding back navigation.** Pages only advance; a fast tapper
  can't re-read.
- **M4 [Low] Error boundary.** A render crash shows a blank screen.
- **M5 [Low] Tests.** None exist.
- **M6 [Low] Web audio verification.** The guiding hum on web needs a check
  against AudioContext autoplay policies.
- **M7 [Low] Dead `eyebrow` style** in HomeScreen.

---

## 4. Verified OK (2026-10-10)

- Navigation: all 8 screens registered; no dangling imports (WhyScreen fully
  removed); Learn tab wired with the book glyph.
- Engine and hum untouched by the techniques work. The nadi L/R indicator
  derives from `breathsCompleted` parity, so it cannot drift from the
  animation. Kumbhaka holds freeze the hum pitch correctly.
- Storage: `aspirationLevel` added with a default; the shallow merge in
  `readJson` covers old installs; no migration needed.
- Aspiration is display-only: nothing downstream of `goalLevel` changed.
- `npx tsc --noEmit` and `npx expo lint` pass clean.

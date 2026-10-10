# PRD — Breath Pacer

## 1. Product summary

Breath Pacer is a slow-breathing training app inspired by the Shiv Swarodaya's
breath-reduction teaching. One guided session a day; the app sets the pace;
the program gets slower as you improve. Built with Expo for iOS, Android, and
web. No accounts, no backend; everything lives on the device.

## 2. The user

Someone who wants a calmer nervous system and a slower resting breath, and
prefers a quiet, guided practice over fitness-app gamification.

## 3. Goals

- Train resting breathing down to a chosen target (11–8 breaths/min),
  comfortable and sustained for 10 minutes.
- Keep the practice honest: only resting breath rate is measured; traditional
  claims are always labeled as tradition.

## 4. Non-goals

- No medical diagnosis or treatment claims.
- No social features, leaderboards, or streak freezes.
- No siddhi promises. No breath-rate targets below 8/min.

## 5. Honesty contract (product rule, non-negotiable)

- **Measured:** resting breath rate (60-second check-in), completed sessions,
  streaks, calm ratings.
- **Traditional:** the siddhi table, the 12-angul map beyond the program,
  verse quotes. Always labeled as tradition, never as outcomes.
- **Never** invent numbers for traditional claims (no BPM values for levels
  5–12; no angul-to-BPM scoring presented as fact).

## 6. Features

### Onboarding (first launch, 5 pages, one idea each)

1. Your breath travels — the single idea.
2. What actually changes — honest outcomes only.
3. How the program works — the contract.
4. Pick your depth — goal levels 1–4 (11/10/9/8 BPM terminal paces) plus an
   optional traditional aspiration (levels 5–12, display-only, with a plain
   warning that the program still trains to 8/min).
5. Today's practice — the protocol plus the safety line.

The same pages live on the Learn tab to revisit anytime.

### Practice — Home tab

- Prescription hero: today's pace (big numeral), minutes, the session's
  technique, one Start button.
- Step badge ("Step N of 4"), goal line, program notes (ease-back warnings,
  unlock celebrations).
- AngulSpanGauge (see audit 1.1: needs reframing), a Sanskrit verse, and
  practice stats (sessions, minutes, breaths, streak).

### Session

- Full-screen animated bloom: expands on inhale, shrinks on exhale, with
  phase label and countdown. Tap the bloom to start/pause; resume continues
  mid-phase. Auto-pauses when backgrounded.
- A continuous guiding hum (pitch rises on inhale, falls on exhale) plus a
  light haptic on phase changes. 10 minutes normally, 5 in maintenance.
- Techniques by program step: paced breathing (steps 0–1), nadi shodhana
  (step 2, with an L/R nostril indicator), kumbhaka (step 3, fixed 4-second
  hold after inhale, full safety copy on the Learn page).
- Ujjayi appears as a small in-session cue toggle from step 1.
- Exiting early discards the session (see audit 2.3).

### Complete

- Calm rating (1–5), session totals, achievements, streak milestones, and
  step/technique unlock notes.

### Journey — Map tab

- The Atmagyan conduit diagram, the 4 training milestones, and the 12-level
  angul table as a reading text tagged as traditional claims.
- Aspiration badge on the chosen horizon row; a thread-test ritual nudge.

### Depth — Progress tab

- Goal card with changeable goal (levels 1–4) and the aspiration selector.
- Guided 60-second resting check-in with recent trend; control-pause
  measurement with neutral reference ranges; a quiet calm-after-session
  trend; settings (guiding hum, daily reminder, theme); session history.

### Learn tab

- "The basics": 3 swipeable pages (what it is, what changes, how it works).
- "Techniques": 5 swipeable pages (paced breathing, ujjayi, nadi shodhana,
  kumbhaka, thread test) with progressive unlock; locked pages show the
  technique name and its unlock step. Page arrows for mouse/web users.

## 7. The program

- 4 steps (0–3); 7 completed sessions per step.
- Pace starts at 11/min and steps down 1/min per step toward the goal's
  terminal pace (11/10/9/8 for levels 1–4), clamped so it never goes below it.
- A 7+ day gap eases back one step with a kind note.
- A resting check-in beating the next step's target advances the pace early.
- Goal held a week (2+ check-ins at/below terminal in 7 days): maintenance
  mode, 5-minute sessions.
- Techniques unlock by stored step and never re-lock after a break.

## 8. Reminders

One daily local notification at the user's chosen time. Quiet copy that
reflects the streak. No nagging.

## 9. Out of scope

Everything in non-goals, plus: no breath-hold training beyond the fixed
4-second kumbhaka, no sub-8 BPM programming, no data export yet.

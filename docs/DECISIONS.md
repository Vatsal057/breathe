# Product decisions — Breath Pacer

Dated log of the calls that shaped the app. Newest first.

## 2026-10-11 — Real Om chant replaces the synthesized drone

The guiding hum is now a real voice: one "OM AUM MANTRA MALE CHANT Bb"
chant per breath (CC-BY 4.0 by CarlosCarty, via Freesound — credited in
Progress settings as the license requires). The full 19.5 s recording is
trimmed by scripts/make-om-cycle.py into a 6 s breath cycle (soft inhale +
Om on exhale); the engine stretches it with pitch-preserving rate to span
exactly one breath at any pace. Rationale: the synth drone never felt like
breathing; a real inhale-then-Om per breath does. The old drone-om.wav stays
in assets/ unused in case the chant needs rework.

## 2026-10-10 — Audit fix pass (on the user's "fix everything")

Every finding in docs/AUDIT.md was fixed the same night:

- Gauge and Map origins card reframed: the 12→8 angul span is labeled a
  traditional map; the app shows only measured BPM beside it. No angul-to-BPM
  scoring presented as fact anywhere.
- Outcome claims softened to what is known ("often", "tends to"); the
  14-day "vagal tone deepens" line rewritten.
- "Level names and fruits come from the old text. We measure only your
  breath rate." now sits under the goal picker (onboarding + Progress) and
  the Map milestones.
- Home: badge uses the stored program step (agrees with the technique line);
  an early pace advance is disclosed in plain words; unlock celebrations no
  longer render in danger red; sessions-remaining shown per step.
- Kumbhaka shows its real practiced pace (~5 BPM), not the program target.
- Program: check-in "week" now requires distinct days; the goal-1
  same-pace quirk is documented in code.
- Removed dead code (why.ts, resolvePreset/SessionConfig, dead styles).
- Added: onboarding back button, "leaving won't record" note on early exit,
  session history deletion with totals recalculated, "Start over" reset in
  settings, error boundary, simplified-form note on nadi shodhana.
- App renamed to Prana Pacer everywhere user-facing; app.json no longer
  forces light OS chrome; project AGENTS.md corrected to React Navigation +
  npm.
- Deferred: test harness (cannot verify from here), web audio check for the
  hum (needs a browser run).

## 2026-10-10 — Aspiration instead of deeper goals (council)

The goal picker stays at 4 trainable levels. Levels 5–12 are selectable only
as a display-only *aspiration* with a plain warning (no measured breath rate,
app cannot verify, program still trains to 8/min). Stored as
`settings.aspirationLevel`, shown on Progress and Map, never drives the
program. Rationale: the tradition gives no breath rates for 5–12; inventing
them would repeat the killed scoring fiction, and sub-8 programming has
safety downsides.

## 2026-10-10 — Techniques with progressive unlock (council)

Five techniques (paced breathing, ujjayi, nadi shodhana, kumbhaka, thread
test) unlock by program step (0/1/2/3, thread at 1). The app prescribes the
session's technique; the user never picks — choice here is clutter. Unlocks
never re-lock after a break. Kumbhaka uses a fixed 4s hold with its safety
copy on the Learn page. The unlock event itself is the hook; no further
gamification.

## 2026-10-10 — Learn tab and 5-page onboarding

Onboarding rebuilt as 5 short pages, one idea each; the same content lives on
the Learn tab (basics deck + techniques deck) to revisit anytime. Page arrows
added for mouse/web users. Dead WhyScreen deleted.

## 2026-10-10 — Honesty contract

Only resting breath rate is measured and promised. Siddhis, the 12-level
map, and verse quotes are tradition, labeled as such. The invented
1 breath/min = 1 angul scoring was removed and must not return in another
form (no BPM values for levels 5–12, no siddhi progress bars).

## 2026-10-10 — Program rules

Session-counted (7 per step), not calendar-based. Ease back one step after a
7+ day gap with a kind note — the prescription never punishes. Early
advancement on a strong check-in. Maintenance (5-min sessions) after the
goal is held a week. Personal-best achievement deleted.

## 2026-10-10 — Working rules

File-only access to the build Mac; the owner runs all commands. Strict
TypeScript + lint before calling work done. Standing rule: convene the pro
software developer + UI designer council before any app change, and always
get their take on increasing the hook.

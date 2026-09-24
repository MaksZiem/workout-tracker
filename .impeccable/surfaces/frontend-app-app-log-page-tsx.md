---
version: 1
slug: "frontend-app-app-log-page-tsx"
primary_target: "frontend/app/(app)/log/page.tsx"
related_targets: []
---

# Surface: Log workout (/log)

Mode: Operate. Mobile-first: a phone at the gym, between sets, often one-handed.

## Job
Confirm today's planned sets fast. Adjust weight and reps only when reality differs from the plan. See last time's numbers, and notice when a set beats a record.

## Flow
- **Picker:** today's PLANNED scheduled workouts (Start, via POST /planner/scheduled/:id/start), today's already-started workouts (Continue), and Empty workout. With exactly one workout today and nothing PLANNED, the screen skips the picker and resumes that workout.
- **Logging:** exercises in order. Each exercise has a set table with columns SET | PREVIOUS | KG | REPS | ✓. The next open set gets steppers (±2.5 kg, ±1 rep). A weight edit cascades to later sets that haven't been touched. Tapping the set number opens a menu (Remove set). Also: + Add set, + Add exercise (catalog search), and Add from description (AI parse).
- **Finish:** a summary (sets, volume, PRs), an offer to remove unchecked sets, then a link to /workouts/[id].

## Data truths
- PR baseline comes from GET /stats/exercise/:id/progress, using only points dated before the workout's date. It is never taken from /stats/records, because that endpoint includes the sets just logged.
- The header title is the workout date plus the muscle groups in it. Workouts carry no template name, and /planner/today does not return the linked workout.
- Every change saves optimistically and goes into a retry queue. Unsaved rows are marked.

## Direction contract
THESIS: The category standard for strength logging, played straight at Strong/Hevy craft. A set table with a checkmark, previous numbers inline, one blue accent. It refuses the invented world and any novelty chrome.
OWN-WORLD: Dark-first neutral graphite surfaces, with a light variant for bright gyms. Blue #3b82f6-family accent for primary actions and focus. A green tint for completed set rows. Gold/amber is reserved for PR medals. Geist UI face, tabular numerals, rounded 8–12px controls, no cards nested in cards.
STORY: The lifter opens /log, taps Start on today's plan, sees every set pre-filled, and checks sets off. Last time's numbers sit beside each set. A beaten record earns one gold medal moment. Finish shows what was done.
FIRST VIEWPORT: Phone 390. Sticky top bar: date, elapsed time, sets done/total, blue Finish. Below it, the first exercise title in blue with its previous-best line, then the set table. The active set row carries steppers, and its checkmark sits under the right thumb.
FORM: Category canon (standing exit), references Strong + Hevy; seed key 825a7f9b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

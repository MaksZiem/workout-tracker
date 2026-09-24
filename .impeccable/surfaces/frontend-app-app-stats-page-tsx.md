---
version: 1
slug: "frontend-app-app-stats-page-tsx"
primary_target: "frontend/app/(app)/stats/page.tsx"
related_targets: ["frontend/app/(app)/stats/exercise/[id]/page.tsx"]
---

# Surface: Stats (/stats, /stats/exercise/[id])

Mode: Operate. Desktop-first (reviewing progress at a desk), fully usable on phone. Inherits DESIGN.md ("The Gym Standard"); an extension of the established world, DESIGN.md not rewritten unless the finish adds a durable pattern (charts).

## Job
Answer "am I getting stronger?" first, then "am I training consistently?". Data comes only from the stats API: per-exercise progress (top set, volume, estimated 1RM per session), records (per exercise and all), muscle-group distribution, frequency (dense day list), streak, summary.

## Structure (user-confirmed)
- /stats overview: header + shared range switch (30 dni / 3 mies. / rok / cały czas, ?range=, default 3 mies.) → "Główne ćwiczenia" (3–4 most-trained in range: est. 1RM trend, current value, change in range; click → detail) → summary line → activity map → muscle groups → records table (row → detail).
- /stats/exercise/[id]: metric switch (1RM / top set / volume, ?metric=), large interactive line chart, three record cards with dates, session list (date, sets "80 × 5").
- Records and streak are always all-time and say so.
- Main exercises: frontend fetches progress for each exercise in /stats/records and ranks by sessions in range (no new endpoint).

## States
New account (one calm message + link to /log), one-session exercise (point + value, change "—"), empty range with history, per-section failure without breaking the page.

## Direction contract
THESIS: Stats as a lifter's progress ledger: the first thing on the page is whether your main lifts are going up, drawn from your own sessions. It refuses the dashboard of equal tiles, hero metric blocks, pie charts and "insight" copy.
OWN-WORLD: DESIGN.md unchanged: graphite tonal stack, Chalk (foreground) chart lines with hairline gridlines, Record Gold only on record points/badges, Done Green intensities only in the activity map, Signal Blue only for actions and focus; the selected range/metric uses the planner's segmented control (Surface fill). Geist 600/400, tabular numerals, 12px surfaces with hairline borders, no shadows.
STORY: The lifter picks a range, sees their 3–4 main lifts with a trend and "+7,5 kg", opens one to read every session and its records, then scans consistency (map, muscle groups) and all records.
FIRST VIEWPORT: Desktop 1440: "Statystyki" left, range segmented control right; below, a row of four exercise cards (name, muscle group, est. 1RM large tabular, change, trend line with gold record dot); under it the one-line summary. Phone 390: header stacked, cards 2×2.
FORM: Established-world surface extension; composition pinned by the user in shape (overview + exercise detail, progress first), so no concept roll. World from seed 825a7f9b (canon). Code-led. Signature interaction: the detail chart's scrubbing crosshair (pointer and arrow keys) reading date, value and sets.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

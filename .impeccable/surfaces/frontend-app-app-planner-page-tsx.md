---
version: 1
slug: "frontend-app-app-planner-page-tsx"
primary_target: "frontend/app/(app)/planner/page.tsx"
related_targets: []
---

# Surface: Planner (/planner)

Mode: Operate. Desktop-first (planning the week at a desk), fully usable on phone. Inherits DESIGN.md ("The Gym Standard"). An extension of the established world: DESIGN.md is not rewritten.

## Job
Lay out training over the coming weeks, and see what is today, what was done, and what was missed. The most frequent action is generating a schedule from a plan: the plan's templates are assigned to weekdays for N weeks.

## Views
- **Week (default).** Desktop: 7 columns, Mon–Sun. Phone: a vertical list of days. Prev/next/Today navigation; today is highlighted.
- **Month.** Toggled from week, persisted as ?view=month. Desktop: calendar grid with template labels. Phone: grid with status dots, plus the selected day's list below it.
- **Entry.** Template name, exercise count, and status in words plus colour:
  - Planned
  - In progress
  - Completed (green, meaning done)
  - Skipped (dimmed)
  - Overdue: derived on the client for a past entry that is still PLANNED

## Actions
- **Primary: "Generate from plan"** (sheet). Pick a plan, assign its templates to weekdays (default spread), pick the range (from the current week, 1–12 weeks), preview the count including dates skipped as already taken, then POST /planner/generate.
- **Entry menu:**
  - Start (today only, goes to /log)
  - Move (date, PATCH)
  - Skip/Restore
  - Delete (with undo)
  - View workout (when linked)
- **Secondary:** "+" on an empty day adds a single template.

## Backend changes (approved)
- Add an IN_PROGRESS status.
- Add Workout.finishedAt and POST /workout/:id/finish, which sets finishedAt and marks the linked scheduled entry COMPLETED.
- The scheduled list returns the linked workout.
- /planner/today accepts ?date=.
- /log calls /finish, and its picker and auto-resume only consider unfinished workouts.

## Direction contract
THESIS: The planner as the category's week sheet. A plain, scannable 7-day board where every day says what is planned and whether it happened. It refuses decorative calendars and dashboard tiles.
OWN-WORLD: The DESIGN.md system unchanged:
- graphite tonal stack; Signal Blue only for actions, today and focus; Done Green for completed entries; Record Gold is not used here
- Geist 600/400 with tabular dates
- 8px controls, 12px entry cards with hairline borders, no shadows except menus and toasts
STORY: The lifter opens the planner and sees this week at a glance. With nothing planned, one blue "Generate from plan" fills four weeks in a few taps, previewed first. Today's entry offers Start. Past entries read done, skipped, or overdue.
FIRST VIEWPORT:
- **Desktop 1440:** page title "Planer" left, with the week range and ‹ Dziś › next to it. At right, a Week/Month segmented toggle and the blue "Generuj z planu". Below, a 7-column board: each column is a day header (weekday, date, today in blue) above that day's entry cards.
- **Phone 390:** the same header stacked, then day rows.
FORM: Established-world surface extension; the user pinned the composition (week default with a month toggle), so no concept roll was run. The world comes from seed 825a7f9b (canon).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

---
version: 1
slug: "frontend-app-app-workouts-page-tsx"
primary_target: "frontend/app/(app)/workouts/page.tsx"
related_targets: ["frontend/app/(app)/workouts/[id]/page.tsx"]
---

# Surface: History (/workouts, /workouts/[id])

Mode: Operate (review). Desktop-first, fully usable on phone. Inherits DESIGN.md ("The Gym Standard"); reuses the Workout List Row grammar, summary line, section headers, Inline Text, Sheet, Confirm Sheet.

## Structure (user-confirmed in shape, 2026-09-25)
- /workouts: Headline; month switcher "‹ Wrzesień 2026 ›" (40px round chevrons, quiet "Ten miesiąc" when away), state in ?month=YYYY-MM; hairline-split summary line (workouts · sets · volume · training days); weeks Monday-first, newest first, each a section header ("22–28 wrz" + count) over one Surface panel of Workout List Rows ("W trakcie" lead for unfinished). Empty month: one panel with a quiet link to the latest earlier month with training and to /log. Data: GET /workout?from&to with exercises and sets (backend relations added).
- /workouts/[id]: back link to its month; header = date as h1, a muted status/time line, notes as Inline Text; right: blue "Powtórz dziś" (POST duplicate → /log?workout=new) or "Kontynuuj" (unfinished → /log?workout=id), Outline "Edytuj" (→ /log?workout=id, finished only), Outline ⋯ ("Zmień datę" sheet → PATCH date; "Usuń" → Confirm Sheet). Summary line: sets done/total · volume · exercises · duration. Exercises as Surface sections (Template Editor proportions): name → /exercises/[id], muscle group, muted per-exercise sets · volume; set table # | kg | powt. | ✓, unchecked rows muted, Done Green check for completed, gold medal replacing the set number on the set that made a record that day (record date = workout date, via GET /stats/records).
- No changes to logger, dashboard, planner.

## Direction contract
THESIS: History is a training log read by month and a session sheet read set by set; editing happens in the logger, and the one action is doing it again. It refuses a calendar-heatmap mosaic, stat tiles, and a second set editor.
OWN-WORLD: DESIGN.md unchanged: graphite tonal stack, 12px hairline Surface panels, Workout List Row (56px date block), hairline summary line, Title section headers with 13px muted counts, tabular Geist 600/400, Done Green only on completed sets, Record Gold only on record medals, one Signal Blue per page.
STORY: The lifter pages back through months, opens a session, sees exactly what was lifted and where a record fell, then repeats it today or fixes it in the logger.
FIRST VIEWPORT: Desktop 1440 list: Headline; month switcher row; summary line; first week header and its rows. Detail: back link; date h1 with status line and notes; right: blue "Powtórz dziś", Outline "Edytuj", ⋯; summary line; first exercise section with its set table. Phone 390: header stacks, blue stretches beside Edytuj and ⋯.
FORM: Established-world surface extension; composition pinned by the user in shape (1/1, no concept roll; world seed 825a7f9b canon). Code-led. Signature: one-tap "Powtórz dziś" into the logger, and record medals on the exact set.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

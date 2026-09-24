---
version: 1
slug: "frontend-app-app-plans-page-tsx"
primary_target: "frontend/app/(app)/plans/page.tsx"
related_targets: ["frontend/app/(app)/plans/[id]/page.tsx"]
---

# Surface: Plans (/plans, /plans/[id]) + shared template editor

Mode: Operate. Desktop-first (building a plan at a desk), fully usable on phone. Inherits DESIGN.md ("The Gym Standard"); an extension of the established world. The template editor is a shared component that /templates/[id] will reuse later.

## Structure (user-confirmed in shape)
- /plans: header with blue "Nowy plan" (name sheet → create → detail) and Outline "Wygeneruj z AI" (sheet: goal, days/week 1–7 stepper, constraints text → POST /ai/generate-plan → /plans/[id]?ai=1). Plan rows: name, notes, "N dni treningowych · M ćwiczeń", template names. Empty list: both paths.
- /plans/[id]: inline-editable name and notes; ⋯ delete plan (confirm; deletes its templates; scheduled entries stay without template). AI banner "Wygenerowane przez AI — przejrzyj…" with dismiss and "Usuń plan". "Zaplanuj w planerze" → /planner?generate={id} (planner opens its generate sheet with this plan). Templates stacked, each a Template Editor; "+ Dodaj dzień treningowy".
- Template Editor: inline name + ⋯ (delete, confirm: scheduled entries keep their dates without a template); exercise table: name + muscle group | sets | reps | kg | rest | ↑↓ | ⋯; fields autosave on blur/Enter (PATCH), saving/saved status, failure reverts with a toast; "+ Dodaj ćwiczenie" reuses the /log catalog sheet (default 3 × 10); removing an exercise offers undo (re-adds). Phone: name row with ↑↓ ⋯, fields in a 4-up labelled grid below.
- No backend changes (templates can't move between plans; not offered). Small frontend change in /planner to accept ?generate=.

## Direction contract
THESIS: A plan is a training week written down: days stacked like pages of a gym notebook, each a compact target table you edit where you read it. It refuses modal-per-field editing, save/cancel edit modes and card mosaics.
OWN-WORLD: DESIGN.md unchanged: graphite tonal stack, 12px hairline sections, the /log five-column table grammar (11px column labels, tabular 15px values in Graphite Muted fields, 8px corners), one Signal Blue primary per page ("Nowy plan" on the list; "Zaplanuj w planerze" on a plan), Outline secondary buttons, Danger Red only for delete, no gold/green here. Geist 600/400.
STORY: The lifter creates or generates a plan, reads it day by day, tightens sets/reps/weights in place, reorders exercises, then sends it to the planner.
FIRST VIEWPORT: Desktop 1440 detail: back link, plan name as the h1 (editable), notes line, blue "Zaplanuj w planerze" right with ⋯; below, the first day section: day name (editable), exercise count, ⋯, then the target table with column labels. List: title + Outline AI + blue Nowy plan; plan rows below. Phone 390: stacked header, day sections full width, 4-up field grids.
FORM: Established-world surface extension; composition pinned by the user in shape, so no concept roll. World from seed 825a7f9b (canon). Code-led. Signature: in-place target editing with per-field autosave and a quiet "Zapisano" status per day.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

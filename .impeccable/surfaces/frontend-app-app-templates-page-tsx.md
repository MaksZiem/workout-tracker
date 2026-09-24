---
version: 1
slug: "frontend-app-app-templates-page-tsx"
primary_target: "frontend/app/(app)/templates/page.tsx"
related_targets: ["frontend/app/(app)/templates/[id]/page.tsx"]
---

# Surface: Templates (/templates, /templates/[id])

Mode: Operate. Desktop-first, fully usable on phone. Inherits DESIGN.md ("The Gym Standard"); an extension of the plans surface and its shared Template Editor.

## Structure (user-confirmed in shape, 2026-09-25)
- /templates: header with blue "Nowy szablon" (name sheet → POST /template without planId → detail). All templates, grouped: "Pojedyncze treningi" first, then one group per plan (list-group header + quiet "Otwórz plan"). Rows in Plan List Row grammar: name, "N ćwiczeń · muscle groups", notes. Empty: one Surface panel with "Nowy szablon" and a quiet link to /plans.
- /templates/[id]: back link (to the plan when plan-owned, else /templates); editable name (h1) + notes; muted "Dzień planu „X”" link for plan-owned; blue "Rozpocznij trening" (or "Kontynuuj trening" when today's entry for it is in progress) + Outline ⋯ (Zaplanuj… date sheet → POST /planner/scheduled; Usuń → Confirm Sheet). Body: one Template Editor in page mode (no day header/⋯; count + save status line). Start disabled with no exercises; empty template's "Dodaj ćwiczenie" becomes the blue action.
- Start: reuse today's PLANNED/IN_PROGRESS entry for the template, else create one for today, then POST /planner/scheduled/:id/start → /log?workout=…; a failed start removes the entry it created.
- Backend: 'plan' added to TemplateService relations (list/detail). Nothing else changes.

## Direction contract
THESIS: A template is a single workout written down, read and edited as one target table, one tap from training. It refuses a card grid of templates, edit modes, and a separate "view" page.
OWN-WORLD: DESIGN.md unchanged: graphite tonal stack, 12px hairline Surface panels, Plan List Row grammar, the Template Editor's target grid (Graphite Muted 40px fields, 11px column labels, tabular 15px values), Inline Text, Outline secondaries, Danger Red only for delete, one Signal Blue per page. Geist 600/400.
STORY: The lifter finds a workout (standalone or a plan's day), tightens its targets in place, then starts it now or puts it on a date.
FIRST VIEWPORT: Desktop 1440 detail: back link; editable name h1, notes line, plan link if any; right: blue "Rozpocznij trening" with play icon, outlined ⋯ square; below, one Surface section: count/save line, column labels, exercise rows. List: headline + blue "Nowy szablon"; "Pojedyncze treningi" group panel, then per-plan group panels. Phone 390: header stacks, blue stretches beside ⋯; 4-up field grids.
FORM: Established-world surface extension; composition pinned by the user in shape (1/1, no concept roll; world seed 825a7f9b canon). Code-led. Signature: start-from-template in one tap, reusing today's planner entry.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

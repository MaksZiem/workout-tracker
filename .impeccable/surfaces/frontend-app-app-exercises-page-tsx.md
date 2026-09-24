---
version: 1
slug: "frontend-app-app-exercises-page-tsx"
primary_target: "frontend/app/(app)/exercises/page.tsx"
related_targets: ["frontend/app/(app)/exercises/[id]/page.tsx","frontend/components/plans/template-editor.tsx"]
---

# Surface: Exercises (/exercises, /exercises/[id]) + "Zamień na podobne" in the Template Editor

Mode: Operate. Desktop-first, fully usable on phone. Inherits DESIGN.md ("The Gym Standard"); extends stats (Record Strip, segmented links, section header) and the Template Editor.

## Structure (user-confirmed in shape, 2026-09-25)
- /exercises: Headline + tabular count; search field (Graphite Muted 44px) filtering on the client; muscle-group segmented links ("Wszystkie" + groups present) with state in ?group=. Groups in enum order under section headers with counts, one Surface list panel each. Row: name; right side your e1RM (15px/600 tabular, "kg") over a muted record date, or muted "Jeszcze nie robione"; chevron. Data: GET /exercise + GET /stats/records (one call). Records failure keeps the catalog and shows a section error.
- /exercises/[id]: back link, name (Headline), muscle group (a quiet link to /exercises?group=). Your numbers: shared Record Strip + quiet "Pełne statystyki" → /stats/exercise/[id]; or a muted "no sets yet" line. Similar: up to 5 rows (name, your e1RM if any, muted "N% podobieństwa") linking to their pages; 404 → muted "not available yet"; error → section error. No blue primary on the page; "Pełne statystyki" is the section-header link (quiet blue, trailing chevron). Similar rows repeat the catalog's "e1RM · date" caption.
- Template Editor ⋯ menu gains "Zamień na podobne": sheet listing similar exercises (fetched on open); pick → PATCH exerciseId (new optional DTO field), row keeps targets/order, toast with "Cofnij" (PATCH back). Candidates already in the day are disabled ("Już w tym dniu"); "Wybierz z całego katalogu" is always offered under the list (it rescues the all-taken case) and is the only action when there are no similar exercises. Catalog swaps are guarded against duplicates.
- Backend: UpdateTemplateExerciseDto.exerciseId + service handling. /stats/exercise/[id]: Record Strip moved to a shared component, no visual change.

## Direction contract
THESIS: An exercise page answers "where do I stand and what can I do instead"; the catalog is a scannable reference with your own numbers inline. It refuses exercise cards with stock imagery, a duplicate of the stats page, and AI presented as magic (similarity is shown as a plain percentage).
OWN-WORLD: DESIGN.md unchanged: graphite tonal stack, 12px hairline Surface list panels, section headers at Title 17px/600 with 13px muted counts, segmented control, Record Strip with the gold trophy glyph only, tabular Geist 600/400; Signal Blue only for links/focus here (no primary button on these pages).
STORY: The lifter scans the catalog, opens an exercise, sees their record, and finds a substitute; in a template they swap an exercise without retyping targets.
FIRST VIEWPORT: Desktop 1440 list: Headline + count left; search field (max 384px) with the group track on its own row below (11 groups do not fit beside the search in the 1024px column); first group header and its rows with right-aligned e1RM. Detail: back link, Headline name, muscle group; Record Strip full width; "Podobne ćwiczenia" section header, rows with percentages. Phone 390: search full width, track scrolls, rows keep the value on the right; the not-done marker shortens to a muted dash so names stay on one line.
FORM: Established-world surface extension; composition pinned by the user in shape (1/1, no concept roll; world seed 825a7f9b canon). Code-led. Signature: one-step "Zamień na podobne" that keeps targets.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

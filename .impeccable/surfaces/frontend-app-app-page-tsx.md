---
version: 1
slug: "frontend-app-app-page-tsx"
primary_target: "frontend/app/(app)/page.tsx"
related_targets: []
---

# Surface: Dashboard (/)

Mode: Operate. The start screen after sign-in: on the phone right before training (start in one tap), on desktop between sessions (week, recent results). Inherits DESIGN.md ("The Gym Standard"); an extension of the established world that ties /log, /planner and /stats together.

## Structure (user-confirmed in shape)
- Header: "Cześć, {name}" + today's date. No metric tiles.
- "Dziś" card (focal): states: scheduled PLANNED → Rozpocznij (startScheduled); unfinished workout (today or last days) → Kontynuuj with elapsed/sets done; completed today → Done Green Tint row with "Wykonany" (planner vocabulary) + link; nothing → "Dziś wolne" + secondary "Zacznij pusty trening"; several → list, each with its own action.
- Week strip Mon–Sun from the planner (planner status colours), "x z y wykonanych", weekly streak; day → /planner?date=.
- AI: "Opisz trening tekstem" → creates today's workout, /ai/parse-workout, redirect to /log for review; on Gemini failure the empty workout is removed and the text stays with a clear error.
- Recent workouts (3 phone / 5 desktop) → /workouts/[id]; "Cała historia".
- Fresh records (last 30 days), the only gold on the page → /stats.
- New account: "Na start" checklist (first workout · plan · schedule), auto-ticked from data, hidden when all done. "Dziś" always visible.
- Layout: phone one column; desktop Dziś + week full width, then two columns (recent left; AI + records right). Per-section failure never breaks the page. No backend changes.

## Direction contract
THESIS: The dashboard as the gym bag by the door: one card says what today is and starts it in one tap; everything else is a quiet glance at the week and recent results. It refuses the KPI-tile dashboard, greeting heroes and decorative charts.
OWN-WORLD: DESIGN.md unchanged: graphite tonal stack, 12px hairline cards, Signal Blue only on the single primary action (Rozpocznij/Kontynuuj; the AI submit is a secondary control), Done Green for completed today and week-strip completed days, Record Gold only in fresh records, planner status vocabulary reused. Geist 600/400, tabular numbers.
STORY: The lifter opens the app, reads "Dziś: Push — klatka i barki · 6 ćwiczeń", taps Rozpocznij and is logging. Later they see the week filling in green, their last sessions and any new records.
FIRST VIEWPORT: Desktop 1440: greeting + date left; below, a full-width Dziś card (template name large, meta, muscle groups, blue Rozpocznij right-aligned), then the Mon–Sun strip with "2 z 4 wykonanych" and the streak. Phone 390: greeting, Dziś card with a full-width 48px blue button, week strip as 7 compact day cells.
FORM: Established-world surface extension; composition pinned by the user in shape, so no concept roll. World from seed 825a7f9b (canon). Code-led. Signature: the Dziś card's state machine (plan → in progress → done) mirrored live in the week strip.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

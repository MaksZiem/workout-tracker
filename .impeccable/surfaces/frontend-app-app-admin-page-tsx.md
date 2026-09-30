---
version: 1
slug: "frontend-app-app-admin-page-tsx"
primary_target: "frontend/app/(app)/admin/page.tsx"
related_targets: ["frontend/app/(app)/admin/exercises/page.tsx"]
---

# Surface: Admin (/admin, /admin/exercises)

Mode: Operate. Desktop-first, fully usable on phone. Inherits DESIGN.md ("The Gym Standard"); recombines existing components only (Section header, Surface list panel, Data Table, Action Menu, Sheet, Confirm Sheet, Toast with Cofnij, Section Error, Catalog Row, Segmented Control).

## Structure (user-confirmed in shape, 2026-09-30)
- /admin: Headline "Administracja" + muted line. Section "Katalog ćwiczeń" (section-header link "Zarządzaj katalogiem" → /admin/exercises): one Surface panel, tabular "N ćwiczeń · M bez embeddingu"; M>0 → Outline "Uzupełnij embeddingi" (pending label, toast "Uzupełniono N"); M=0 → muted "all have embeddings". Gemini failure → inline Danger Red Tint alert in that panel. Section "Użytkownicy": Data Table (name, e-mail, role, workouts) with ⋯ Action Menu per row: grant/revoke admin (immediate, toast with Cofnij), delete user (Confirm Sheet naming the cascade and workout count). Own row marked "Ty", no menu. Phone: hairline-divided list.
- /admin/exercises: back link to /admin, Headline, count line, blue "Dodaj ćwiczenie" (the page's only blue). Search + group segmented links (state in ?group=) exactly as /exercises. Rows: name, muted "Brak embeddingu" marker, ⋯ (Edytuj, Usuń); row click opens edit. Exercise sheet: name field + 10-option muscle-group radio grid (segmented look, 2 cols phone / 5 from sm), hint that the embedding recalculates; locked while saving; duplicate name → field error, form kept. Delete sheet preflights usage (GET /exercise/:id/usage): unused → Confirm Sheet; used → explanation with counts and "Edytuj" instead of Danger.
- Backend: GET /auth/users (AdminGuard, + workoutCount); self-protection on DELETE/PATCH /auth/:id; GET /exercise/:id/usage; DELETE /exercise/:id → 409 when used; duplicate name → 409 (case-insensitive); embedding hidden from JSON, `hasEmbedding` exposed; Gemini failure on create/update saves with embedding null (toast warns).

## Build decisions (2026-09-30)
- Role column shows "Użytkownik" muted and "Administrator" in foreground with a ShieldCheck glyph (the nav's admin icon), not blank-for-user: a blank cell reads as missing data, and the phone meta line would open with a bare "·".
- Muscle-group radio grid is 2 columns at all widths (matches the AI Plan Sheet goal grid; 10 options leave an orphan at 3 columns).
- Page title keeps the existing "Panel admina" nav label.
- Delete-exercise sheet title is only the exercise name until usage resolves; it never asks "Usunąć?" before it knows.

- Users list (2026-09-30, follow-up request): backend search (name, surname, full name, e-mail; ILIKE with % and _ taken literally), sort (name | email | role | workoutCount, asc/desc, ties by name then id) and pagination (page, limit ≤100, out-of-range page clamps to the last). UI state in the URL; column headers sort from `sm`, a native select sorts on phones; page size 10/20/50/100 (default 20, `?limit=`) chosen in the footer, which shows from 11 accounts; range + prev/next.

## Direction contract
THESIS: Admin is a maintenance desk for the two things only an admin can change, the shared catalog and who holds the admin role; every action states its consequence before it happens. It refuses the admin-dashboard template (KPI tiles, charts, "system health" gauges, activity feeds).
OWN-WORLD: DESIGN.md unchanged: graphite tonal stack, 12px hairline Surface list panels, Title 17px/600 section headers with 13px muted counts, Data Table with Column Labels, tabular Geist; Signal Blue only for links/focus on /admin and for the one "Dodaj ćwiczenie" on /admin/exercises; Danger Red only in menus and Confirm Sheets; no gold.
STORY: The admin sees at a glance whether the catalog is complete (embeddings) and who the users are, fixes a gap in one click, and edits or retires an exercise without breaking anyone's history.
FIRST VIEWPORT: Desktop 1440, 1024px column: Headline + muted line; "Katalog ćwiczeń" header with the quiet blue link at the right edge, then one panel with the count line left and the Outline backfill action right; 40px down, "Użytkownicy" header with count, the users table filling the column. /admin/exercises: back link, Headline + count left, blue add right; search (max 384px), group track below; first group section. Phone 390: panels full width, backfill button full width under the line, table becomes a list.
FORM: Established-world surface, composition pinned by the user in shape (1/1, no concept roll; world seed 825a7f9b canon). Code-led. Signature: the delete sheet that knows before you click whether deletion is possible.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

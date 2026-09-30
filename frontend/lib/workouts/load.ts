import "server-only";

import { serverApi } from "@/lib/api/server";
import { unwrap } from "@/lib/api/errors";
import { addDays, monthEnd, monthStart } from "@/lib/planner/dates";
import { settle } from "@/lib/stats/model";
import { summarize, toDetail, toRow, toWeeks, type RowContext } from "./model";

/** Jak daleko wstecz szukamy poprzedniego miesiąca z treningami (2 lata). */
const EARLIER_WINDOW_DAYS = 730;

/** `?month=YYYY-MM` → pierwszy dzień miesiąca; inaczej bieżący miesiąc. */
export function parseMonth(value: unknown, today: string) {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? `${value}-01` : monthStart(today);
}

/** Treningi miesiąca (z ćwiczeniami i seriami) pogrupowane w tygodnie. */
export async function loadMonth(month: string) {
  const api = await serverApi();
  const from = month;
  const to = monthEnd(month);
  // Planer, szablony i rekordy tylko dopisują etykiety: bez nich lista działa dalej.
  const [list, scheduled, templates, records] = await Promise.all([
    settle(unwrap(api.GET("/workout", { params: { query: { from, to } } }))),
    settle(unwrap(api.GET("/planner/scheduled", { params: { query: { from, to } } }))),
    settle(unwrap(api.GET("/template"))),
    settle(unwrap(api.GET("/stats/records"))),
  ]);
  if (!list.ok) return { ok: false as const };

  const planByTemplate = new Map(
    (templates.ok ? templates.data : []).map((t) => [t.id, t.plan ? { id: t.plan.id, name: t.plan.name } : null]),
  );
  const ctx: RowContext = {
    scheduled: new Map(
      (scheduled.ok ? scheduled.data : []).flatMap((s) =>
        s.workout
          ? [[s.workout.id, { templateName: s.template?.name ?? null, plan: s.template ? (planByTemplate.get(s.template.id) ?? null) : null }] as const]
          : [],
      ),
    ),
    records: records.ok ? records.data : [],
  };
  const rows = list.data.map((w) => toRow(w, ctx));
  // Pusty miesiąc: gdzie jest ostatni wcześniejszy trening. Mapa aktywności zwraca same
  // daty (tanio), a okno EARLIER_WINDOW_DAYS ogranicza zapytanie.
  let earlier: string | null = null;
  if (rows.length === 0) {
    const to = addDays(month, -1);
    const days = await settle(
      unwrap(api.GET("/stats/frequency", { params: { query: { from: addDays(to, -EARLIER_WINDOW_DAYS), to } } })),
    );
    const last = days.ok ? days.data.findLast((d) => d.count > 0) : undefined;
    if (last) {
      earlier = monthStart(last.date);
    } else {
      // Rzadki przypadek: nic w oknie. Jedno pełne zapytanie (lista jest odchudzona, bez
      // embeddingów), żeby „wcześniej nie ma treningów” było prawdą, a nie skutkiem okna.
      const older = await settle(unwrap(api.GET("/workout", { params: { query: { to } } })));
      earlier = older.ok && older.data.length ? monthStart(older.data[0].date) : null;
    }
  }

  return { ok: true as const, rows, weeks: toWeeks(rows), summary: summarize(rows), earlier };
}

/** Trening z rekordami do oznaczenia serii; `null`, gdy nie istnieje. */
export async function loadWorkoutDetail(id: number) {
  const api = await serverApi();
  const [{ data: workout }, records] = await Promise.all([
    api.GET("/workout/{id}", { params: { path: { id } } }),
    // Bez rekordów strona działa, tylko bez medali.
    settle(unwrap(api.GET("/stats/records"))),
  ]);
  if (!workout) return null;
  return toDetail(workout, records.ok ? records.data : []);
}

import "server-only";

import { serverApi } from "@/lib/api/server";
import { unwrap } from "@/lib/api/errors";
import { toEditorTemplate, type EditorTemplate, type PlanSummary } from "./model";

/**
 * Lista planów. GET /plan nie zwraca szablonów, więc szczegóły każdego planu
 * pobieramy równolegle (planów jest zwykle kilka).
 */
export async function loadPlans(): Promise<PlanSummary[]> {
  const api = await serverApi();
  const plans = await unwrap(api.GET("/plan"));
  const details = await Promise.all(
    plans.map(async (p) => (await api.GET("/plan/{id}", { params: { path: { id: p.id } } })).data ?? p),
  );
  return details.map((plan) => {
    const templates = [...(plan.templates ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((t) => ({ id: t.id, name: t.name, exerciseCount: t.exercises?.length ?? 0 }));
    return {
      id: plan.id,
      name: plan.name,
      notes: plan.notes ?? null,
      templates,
      exerciseCount: templates.reduce((sum, t) => sum + t.exerciseCount, 0),
    };
  });
}

export type PlanDetail = { id: number; name: string; notes: string; templates: EditorTemplate[] };

/** Plan z szablonami do edycji; `null`, gdy nie istnieje. */
export async function loadPlan(id: number): Promise<PlanDetail | null> {
  const api = await serverApi();
  const { data: plan } = await api.GET("/plan/{id}", { params: { path: { id } } });
  if (!plan) return null;
  return {
    id: plan.id,
    name: plan.name,
    notes: plan.notes ?? "",
    // Dni treningowe w kolejności dodania.
    templates: [...(plan.templates ?? [])].sort((a, b) => a.id - b.id).map(toEditorTemplate),
  };
}

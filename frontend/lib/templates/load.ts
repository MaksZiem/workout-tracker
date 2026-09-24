import "server-only";

import { serverApi } from "@/lib/api/server";
import { unwrap } from "@/lib/api/errors";
import type { MuscleGroup, WorkoutTemplate } from "@/lib/api/extra-types";
import { localDate } from "@/lib/log/model";
import { toEditorTemplate } from "@/lib/plans/model";
import { todayState, type TemplateDetail, type TemplateGroup, type TemplateSummary } from "./model";

function toSummary(template: WorkoutTemplate, running: Set<number>): TemplateSummary {
  const exercises = [...(template.exercises ?? [])].sort((a, b) => a.order - b.order || a.id - b.id);
  const muscleGroups = [...new Set(exercises.map((te) => te.exercise.muscleGroup as MuscleGroup))];
  return {
    id: template.id,
    name: template.name,
    notes: template.notes ?? null,
    exerciseCount: exercises.length,
    muscleGroups,
    inProgress: running.has(template.id),
  };
}

/**
 * Wszystkie szablony użytkownika: najpierw pojedyncze treningi, potem dni
 * każdego planu (plany od najnowszego, dni w kolejności dodania, jak w planie).
 */
export async function loadTemplates(): Promise<TemplateGroup[]> {
  const api = await serverApi();
  const [templates, { data: today }] = await Promise.all([
    unwrap(api.GET("/template")),
    api.GET("/planner/today", { params: { query: { date: localDate() } } }),
  ]);
  const running = new Set(
    (today ?? []).filter((e) => e.status === "IN_PROGRESS" && e.template).map((e) => e.template!.id),
  );
  const summary = (t: WorkoutTemplate) => toSummary(t, running);

  const standalone = templates.filter((t) => !t.plan);
  const byPlan = new Map<number, { plan: { id: number; name: string; createdAt: string }; items: WorkoutTemplate[] }>();
  for (const template of templates) {
    if (!template.plan) continue;
    const group = byPlan.get(template.plan.id) ?? { plan: template.plan, items: [] };
    group.items.push(template);
    byPlan.set(template.plan.id, group);
  }

  const planGroups = [...byPlan.values()]
    .sort((a, b) => b.plan.createdAt.localeCompare(a.plan.createdAt))
    .map(({ plan, items }) => ({
      plan: { id: plan.id, name: plan.name },
      templates: items.sort((a, b) => a.id - b.id).map(summary),
    }));

  return [{ plan: null, templates: standalone.map(summary) }, ...planGroups];
}

/** Szablon do edycji z planem i dzisiejszym wpisem w planerze; `null`, gdy nie istnieje. */
export async function loadTemplate(id: number): Promise<TemplateDetail | null> {
  const api = await serverApi();
  const { data: template } = await api.GET("/template/{id}", { params: { path: { id } } });
  if (!template) return null;

  // Brak danych z planera nie blokuje edycji: przycisk po prostu zaczyna od nowa.
  const { data: today } = await api.GET("/planner/today", { params: { query: { date: localDate() } } });

  return {
    template: toEditorTemplate(template),
    notes: template.notes ?? "",
    plan: template.plan ? { id: template.plan.id, name: template.plan.name } : null,
    today: todayState(today ?? [], template.id),
  };
}

import "server-only";

import { serverApi } from "@/lib/api/server";
import type { MuscleGroup } from "@/lib/api/extra-types";
import type { PlanOption, PlannerEntry, TemplateOption } from "./model";

function muscleGroupsOf(exercises: { exercise?: { muscleGroup: string } }[] | undefined): MuscleGroup[] {
  return [...new Set((exercises ?? []).map((te) => te.exercise?.muscleGroup as MuscleGroup).filter(Boolean))];
}

/** Wpisy planera w zakresie, szablony (do dodawania) i plany (do generowania). */
export async function loadPlanner(from: string, to: string) {
  const api = await serverApi();
  const [{ data: scheduled }, { data: templatesData }, { data: plansData }] = await Promise.all([
    api.GET("/planner/scheduled", { params: { query: { from, to } } }),
    api.GET("/template"),
    api.GET("/plan"),
  ]);

  const templates: TemplateOption[] = (templatesData ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    exerciseCount: t.exercises?.length ?? 0,
    muscleGroups: muscleGroupsOf(t.exercises),
  }));
  const byId = new Map(templates.map((t) => [t.id, t]));

  const entries: PlannerEntry[] = (scheduled ?? []).map((item) => {
    const template = item.template ? byId.get(item.template.id) : undefined;
    return {
      id: item.id,
      date: item.date,
      status: item.status,
      templateId: item.template?.id ?? null,
      templateName: item.template?.name ?? null,
      exerciseCount: template?.exerciseCount ?? 0,
      muscleGroups: template?.muscleGroups ?? [],
      workoutId: item.workout?.id ?? null,
    };
  });

  const plans: PlanOption[] = (plansData ?? []).map((p) => ({ id: p.id, name: p.name }));

  return { entries, templates, plans };
}

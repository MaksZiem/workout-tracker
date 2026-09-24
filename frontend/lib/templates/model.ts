import type { MuscleGroup, ScheduledWorkout } from "@/lib/api/extra-types";
import type { EditorTemplate } from "@/lib/plans/model";

export type TemplateSummary = {
  id: number;
  name: string;
  notes: string | null;
  exerciseCount: number;
  muscleGroups: MuscleGroup[];
  /** Dzisiejszy trening z tego szablonu jest w toku. */
  inProgress: boolean;
};

/** Grupa na liście: `plan: null` to pojedyncze treningi (szablony bez planu). */
export type TemplateGroup = { plan: { id: number; name: string } | null; templates: TemplateSummary[] };

/** Czy ten szablon jest już dziś w planerze: w trakcie (kontynuuj) albo zaplanowany (rozpocznij). */
export type TodayState = { kind: "none" } | { kind: "planned"; scheduledId: number } | { kind: "inProgress"; workoutId: number };

export type TemplateDetail = {
  template: EditorTemplate;
  notes: string;
  plan: { id: number; name: string } | null;
  today: TodayState;
};

export function todayState(entries: ScheduledWorkout[], templateId: number): TodayState {
  const own = entries.filter((e) => e.template?.id === templateId);
  const running = own.find((e) => e.status === "IN_PROGRESS" && e.workout?.id);
  if (running?.workout) return { kind: "inProgress", workoutId: running.workout.id };
  const planned = own.find((e) => e.status === "PLANNED");
  if (planned) return { kind: "planned", scheduledId: planned.id };
  return { kind: "none" };
}

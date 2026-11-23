import type { MuscleGroup, ScheduledWorkout } from "@/lib/api/extra-types";
import type { EditorTemplate } from "@/lib/plans/model";

export type TemplateSummary = {
  id: string;
  name: string;
  notes: string | null;
  exerciseCount: number;
  muscleGroups: MuscleGroup[];
  inProgress: boolean;
};

export type TemplateGroup = { plan: { id: string; name: string } | null; templates: TemplateSummary[] };

export type TodayState = { kind: "none" } | { kind: "planned"; scheduledId: string } | { kind: "inProgress"; workoutId: string };

export type TemplateDetail = {
  template: EditorTemplate;
  notes: string;
  plan: { id: string; name: string } | null;
  today: TodayState;
};

export function todayState(entries: ScheduledWorkout[], templateId: string): TodayState {
  const own = entries.filter((e) => e.template?.id === templateId);
  const running = own.find((e) => e.status === "IN_PROGRESS" && e.workout?.id);
  if (running?.workout) return { kind: "inProgress", workoutId: running.workout.id };
  const planned = own.find((e) => e.status === "PLANNED");
  if (planned) return { kind: "planned", scheduledId: planned.id };
  return { kind: "none" };
}

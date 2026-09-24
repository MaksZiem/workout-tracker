import type { MuscleGroup, ScheduledWorkoutStatus } from "@/lib/api/extra-types";

export type PlannerEntry = {
  id: number;
  date: string;
  status: ScheduledWorkoutStatus;
  templateId: number | null;
  templateName: string | null;
  exerciseCount: number;
  muscleGroups: MuscleGroup[];
  workoutId: number | null;
};

export type TemplateOption = {
  id: number;
  name: string;
  exerciseCount: number;
  muscleGroups: MuscleGroup[];
};

export type PlanOption = { id: number; name: string };

/** Status widoczny w UI: backendowy albo wyliczony „zaległy”. */
export type DisplayStatus = ScheduledWorkoutStatus | "OVERDUE";

/** Kolor kropki statusu (miesiąc w planerze, pasek tygodnia na pulpicie). */
export const STATUS_DOT: Record<DisplayStatus, string> = {
  PLANNED: "bg-muted",
  IN_PROGRESS: "bg-foreground",
  COMPLETED: "bg-success",
  SKIPPED: "border border-muted",
  OVERDUE: "bg-danger",
};

export function displayStatus(entry: PlannerEntry, today: string): DisplayStatus {
  return entry.status === "PLANNED" && entry.date < today ? "OVERDUE" : entry.status;
}

/** Domyślne rozłożenie N szablonów na dni tygodnia (0 = poniedziałek). */
export function defaultSpread(count: number): number[] {
  const presets: Record<number, number[]> = {
    1: [0],
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return presets[count] ?? Array.from({ length: count }, (_, i) => i % 7);
}

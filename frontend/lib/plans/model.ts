import type { MuscleGroup, WorkoutTemplate } from "@/lib/api/extra-types";
import { parseWeight } from "@/lib/log/model";

export type EditorExercise = {
  id: number;
  exerciseId: number;
  name: string;
  muscleGroup: MuscleGroup;
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
  restSeconds: number | null;
};

export type EditorTemplate = { id: number; name: string; exercises: EditorExercise[] };

export type PlanSummary = {
  id: number;
  name: string;
  notes: string | null;
  templates: { id: number; name: string; exerciseCount: number }[];
  exerciseCount: number;
};

/** Szablon z API → stan edytora (ćwiczenia w kolejności). */
export function toEditorTemplate(template: WorkoutTemplate): EditorTemplate {
  return {
    id: template.id,
    name: template.name,
    exercises: [...(template.exercises ?? [])]
      .sort((a, b) => a.order - b.order || a.id - b.id)
      .map((te) => ({
        id: te.id,
        exerciseId: te.exercise.id,
        name: te.exercise.name,
        muscleGroup: te.exercise.muscleGroup as MuscleGroup,
        order: te.order,
        targetSets: te.targetSets,
        targetReps: te.targetReps,
        targetWeight: te.targetWeight === null || te.targetWeight === undefined ? null : Number(te.targetWeight),
        restSeconds: te.restSeconds ?? null,
      })),
  };
}

export type TargetField = "targetSets" | "targetReps" | "targetWeight" | "restSeconds";

/** Dopuszczalne wartości pól celu; puste pole = brak (tylko ciężar i przerwa). */
const LIMITS: Record<TargetField, { min: number; max: number; optional: boolean }> = {
  targetSets: { min: 1, max: 20, optional: false },
  targetReps: { min: 1, max: 100, optional: false },
  targetWeight: { min: 0, max: 1000, optional: true },
  restSeconds: { min: 0, max: 600, optional: true },
};

/** Wartość z pola tekstowego; `undefined` = nieprawidłowa. */
export function parseTarget(field: TargetField, input: string): number | null | undefined {
  const text = input.trim();
  const limit = LIMITS[field];
  if (!text) return limit.optional ? null : undefined;
  const value = field === "targetWeight" ? parseWeight(text) : Number(text);
  if (value === null || !Number.isFinite(value)) return undefined;
  if (field !== "targetWeight" && !Number.isInteger(value)) return undefined;
  if (value < limit.min || value > limit.max) return undefined;
  return value;
}

/** Zamiana miejscami dwóch sąsiednich ćwiczeń; zwraca nową listę z kolejnością 0..n. */
export function moveExercise(exercises: EditorExercise[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= exercises.length) return null;
  const next = [...exercises];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((e, i) => ({ ...e, order: i }));
}

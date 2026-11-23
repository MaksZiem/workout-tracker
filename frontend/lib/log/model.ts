import type { ExerciseProgressPoint, MuscleGroup } from "@/lib/api/extra-types";

export type PreviousSession = { date: string; sets: { weight: number; reps: number }[] };

export type Baseline = { maxWeight: number; maxE1rm: number };

export type SyncStatus = "saved" | "pending" | "failed";

export type LogSet = {
  key: string;
  id?: string;
  setNumber: number;
  weight: number;
  reps: number;
  restSeconds?: number | null;
  completed: boolean;
  touched: boolean;
  status: SyncStatus;
};

export type LogExercise = {
  key: string;
  id?: string;
  order: number;
  exercise: { id: string; name: string; muscleGroup: MuscleGroup };
  sets: LogSet[];
  previous: PreviousSession | null;
  baseline: Baseline | null;
  fromAi?: boolean;
  status: SyncStatus;
};

export type LogWorkout = {
  id: string;
  date: string;
  createdAt: string;
  exercises: LogExercise[];
};

export const WEIGHT_STEP = 2.5;

export function estimatedOneRepMax(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

export function roundWeight(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

export function localDate(date = new Date(), timeZone = "Europe/Warsaw") {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function previousFrom(points: ExerciseProgressPoint[], beforeDate: string): PreviousSession | null {
  const earlier = points.filter((p) => p.date < beforeDate && p.sets.length > 0);
  const last = earlier.at(-1);
  if (!last) return null;
  const sets = [...last.sets].sort((a, b) => b.weight - a.weight || b.reps - a.reps);
  return { date: last.date, sets };
}

export function baselineFrom(points: ExerciseProgressPoint[], beforeDate: string): Baseline | null {
  const earlier = points.filter((p) => p.date < beforeDate && p.sets.length > 0);
  if (!earlier.length) return null;
  return {
    maxWeight: Math.max(...earlier.map((p) => p.topWeight)),
    maxE1rm: Math.max(...earlier.map((p) => p.estimatedOneRepMax)),
  };
}

export type PrKind = "weight" | "e1rm";

export function personalRecords(exercise: LogExercise): Map<string, PrKind> {
  const records = new Map<string, PrKind>();
  if (!exercise.baseline) return records;
  let maxWeight = exercise.baseline.maxWeight;
  let maxE1rm = exercise.baseline.maxE1rm;
  for (const set of exercise.sets) {
    if (!set.completed || set.reps <= 0 || set.weight <= 0) continue;
    const e1rm = estimatedOneRepMax(set.weight, set.reps);
    if (set.weight > maxWeight) {
      records.set(set.key, "weight");
    } else if (e1rm > maxE1rm + 0.01) {
      records.set(set.key, "e1rm");
    }
    maxWeight = Math.max(maxWeight, set.weight);
    maxE1rm = Math.max(maxE1rm, e1rm);
  }
  return records;
}

export function workoutTotals(exercises: LogExercise[]) {
  let done = 0;
  let total = 0;
  let volume = 0;
  let records = 0;
  for (const exercise of exercises) {
    records += personalRecords(exercise).size;
    for (const set of exercise.sets) {
      total += 1;
      if (set.completed) {
        done += 1;
        volume += set.weight * set.reps;
      }
    }
  }
  return { done, total, volume, records };
}

export function parseWeight(input: string): number | null {
  const normalized = input.replace(",", ".").trim();
  if (normalized === "") return 0;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 && value < 10000 ? roundWeight(value) : null;
}

export function parseReps(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return 0;
  const value = Number(trimmed);
  return Number.isInteger(value) && value >= 0 && value < 1000 ? value : null;
}

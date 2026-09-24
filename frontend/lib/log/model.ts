import type { ExerciseProgressPoint, MuscleGroup } from "@/lib/api/extra-types";

/** Ostatnia sesja ćwiczenia sprzed daty treningu (do kolumny „Poprzednio”). */
export type PreviousSession = { date: string; sets: { weight: number; reps: number }[] };

/**
 * Punkt odniesienia dla rekordów: najlepsze wyniki sprzed daty treningu.
 * Liczony z historii postępów, NIE z /stats/records, bo tamten endpoint wlicza
 * serie zapisane w bieżącym treningu (po przeładowaniu seria biłaby samą siebie).
 */
export type Baseline = { maxWeight: number; maxE1rm: number };

/** saved = zapisane lub w drodze; pending = ponawiamy po błędzie sieci; failed = odrzucone. */
export type SyncStatus = "saved" | "pending" | "failed";

export type LogSet = {
  /** Stabilny klucz klienta; `id` pojawia się po zapisaniu w backendzie. */
  key: string;
  id?: number;
  setNumber: number;
  weight: number;
  reps: number;
  restSeconds?: number | null;
  completed: boolean;
  /** Czy użytkownik sam zmienił ciężar (wtedy kaskada go nie nadpisuje). */
  touched: boolean;
  status: SyncStatus;
};

export type LogExercise = {
  key: string;
  id?: number;
  order: number;
  exercise: { id: number; name: string; muscleGroup: MuscleGroup };
  sets: LogSet[];
  previous: PreviousSession | null;
  baseline: Baseline | null;
  fromAi?: boolean;
  status: SyncStatus;
};

export type LogWorkout = {
  id: number;
  date: string;
  createdAt: string;
  exercises: LogExercise[];
};

export const WEIGHT_STEP = 2.5;

/** Epley, ten sam wzór co backend (stats/helpers.ts). */
export function estimatedOneRepMax(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

export function roundWeight(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

/** Dzisiejsza data (YYYY-MM-DD) w strefie użytkownika. */
export function localDate(date = new Date(), timeZone = "Europe/Warsaw") {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function previousFrom(points: ExerciseProgressPoint[], beforeDate: string): PreviousSession | null {
  const earlier = points.filter((p) => p.date < beforeDate && p.sets.length > 0);
  const last = earlier.at(-1);
  if (!last) return null;
  // Endpoint postępów nie zwraca numeru serii ani stałej kolejności, więc
  // porządkujemy deterministycznie: od najcięższej serii.
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

/**
 * Rekordy w obrębie ćwiczenia: kolejne zrobione serie, które przebijają
 * bieżące maksimum (zaczynając od punktu odniesienia). Brak historii = brak rekordów.
 * Zwraca mapę klucz serii → rodzaj rekordu.
 */
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

/** Parsuje ciężar wpisany z przecinkiem lub kropką. Zwraca null dla błędnych danych. */
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

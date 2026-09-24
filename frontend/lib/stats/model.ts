import type { ExerciseProgressPoint, MuscleGroup } from "@/lib/api/extra-types";
import { addDays, weekStart } from "@/lib/planner/dates";
import type { StatsMetric } from "./range";

/** Sekcja, która mogła się nie wczytać: błąd jednej nie psuje całej strony. */
export type Section<T> = { ok: true; data: T } | { ok: false };

export async function settle<T>(promise: Promise<T>): Promise<Section<T>> {
  try {
    return { ok: true, data: await promise };
  } catch {
    return { ok: false };
  }
}

/** Sesja ćwiczenia z przynajmniej jedną ukończoną serią. */
export type Session = ExerciseProgressPoint;

export function sessionsOf(points: ExerciseProgressPoint[]): Session[] {
  return points.filter((p) => p.sets.length > 0);
}

export function metricValue(session: Session, metric: StatsMetric) {
  if (metric === "top") return session.topWeight;
  if (metric === "volume") return session.volume;
  return session.estimatedOneRepMax;
}

export type TrendPoint = { date: string; value: number };

export type MainExercise = {
  id: number;
  name: string;
  muscleGroup: MuscleGroup | null;
  sessions: number;
  points: TrendPoint[];
  /** Ostatnia wartość szacowanego 1RM w zakresie. */
  current: number;
  /** Różnica między ostatnią a pierwszą sesją w zakresie; null przy jednej sesji. */
  change: number | null;
  /** Data rekordu szacowanego 1RM (z całej historii), jeśli wypada w zakresie. */
  recordDate: string | null;
};

export function toMainExercise(
  id: number,
  name: string,
  muscleGroup: MuscleGroup | null,
  sessions: Session[],
  recordDate: string | null,
): MainExercise {
  const points = sessions.map((s) => ({ date: s.date, value: s.estimatedOneRepMax }));
  const first = points[0];
  const last = points.at(-1)!;
  return {
    id,
    name,
    muscleGroup,
    sessions: sessions.length,
    points,
    current: last.value,
    change: points.length > 1 ? last.value - first.value : null,
    recordDate: recordDate && points.some((p) => p.date === recordDate) ? recordDate : null,
  };
}

/**
 * Passa w tygodniach: kolejne tygodnie (pon–niedz.) z co najmniej jednym treningiem.
 * Bieżący tydzień bez treningu jeszcze nie przerywa passy.
 */
export function weeklyStreak(days: { date: string; count: number }[], today: string) {
  const trained = new Set<string>();
  for (const d of days) if (d.count > 0) trained.add(weekStart(d.date));
  let week = weekStart(today);
  if (!trained.has(week)) week = addDays(week, -7);
  let streak = 0;
  while (trained.has(week)) {
    streak++;
    week = addDays(week, -7);
  }
  return streak;
}

/** Kilogramy do wyświetlenia: pół kilograma dokładności wystarcza. */
export function roundKg(value: number) {
  return Math.round(value * 2) / 2;
}

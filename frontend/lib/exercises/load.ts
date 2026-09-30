import "server-only";

import { serverApi } from "@/lib/api/server";
import { ApiError, unwrap } from "@/lib/api/errors";
import { MUSCLE_GROUPS, type ExercisePersonalRecords, type MuscleGroup } from "@/lib/api/extra-types";
import { settle, type Section } from "@/lib/stats/model";

/** Twój wynik w ćwiczeniu na liście: najlepszy szacowany 1RM i dzień, w którym padł. */
export type ExerciseMark = { e1rm: number; date: string; set: { weight: number; reps: number } };

export type CatalogExercise = { id: number; name: string; muscleGroup: MuscleGroup; mark: ExerciseMark | null };

/** Zamiennik dobrany przez AI, z uzasadnieniem i twoim wynikiem w nim. */
export type SubstituteItem = { id: number; name: string; reason: string; mark: ExerciseMark | null };

function marksOf(records: ExercisePersonalRecords[]) {
  return new Map(
    records.map((r) => [r.exerciseId, {
        e1rm: Number(r.bestEstimatedOneRepMax),
        date: r.bestEstimatedOneRepMaxDate,
        set: { weight: r.bestEstimatedOneRepMaxWeight, reps: r.bestEstimatedOneRepMaxReps },
      }]),
  );
}

/**
 * Katalog z twoimi rekordami (jedno zapytanie o wszystkie). Brak rekordów
 * nie blokuje katalogu: sekcja pokazuje wtedy błąd tylko przy wynikach.
 */
export async function loadCatalog() {
  const api = await serverApi();
  const [exercises, records] = await Promise.all([
    unwrap(api.GET("/exercise")),
    settle(unwrap(api.GET("/stats/records"))),
  ]);
  const marks = records.ok ? marksOf(records.data) : new Map<number, ExerciseMark>();
  const order = (g: MuscleGroup) => MUSCLE_GROUPS.indexOf(g);
  const items: CatalogExercise[] = exercises
    .map((e) => ({ id: e.id, name: e.name, muscleGroup: e.muscleGroup as MuscleGroup, mark: marks.get(e.id) ?? null }))
    .sort((a, b) => order(a.muscleGroup) - order(b.muscleGroup) || a.name.localeCompare(b.name, "pl"));
  return { items, recordsOk: records.ok };
}

/** Zamienniki: `pending`, gdy AI jeszcze ich nie dobierało (pusta lista znaczy wtedy „nie wiadomo”, a nie „brak”). */
export type SubstitutesSection = { ok: true; data: SubstituteItem[] } | { ok: false; reason: "pending" | "error" };

/** Karta ćwiczenia; `null`, gdy nie istnieje. */
export async function loadExerciseCard(id: number) {
  const api = await serverApi();
  const exercise = await api.GET("/exercise/{id}", { params: { path: { id } } });
  if (exercise.response.status === 404) return null;
  if (!exercise.data) throw ApiError.from(exercise.error, exercise.response);

  const [records, substitutes] = await Promise.all([
    settle(unwrap(api.GET("/stats/records"))),
    settle(unwrap(api.GET("/exercise/{id}/substitutes", { params: { path: { id } } }))),
  ]);
  const marks = records.ok ? marksOf(records.data) : new Map<number, ExerciseMark>();

  const own: Section<ExercisePersonalRecords | null> = records.ok
    ? { ok: true, data: records.data.find((r) => r.exerciseId === id) ?? null }
    : { ok: false };

  const substitutesSection: SubstitutesSection = !substitutes.ok
    ? { ok: false, reason: "error" }
    : !exercise.data.substitutesGeneratedAt && substitutes.data.length === 0
      ? { ok: false, reason: "pending" }
      : {
          ok: true,
          data: substitutes.data.map((s) => ({
            id: s.exercise.id,
            name: s.exercise.name,
            reason: s.reason,
            mark: marks.get(s.exercise.id) ?? null,
          })),
        };

  return {
    exercise: { id: exercise.data.id, name: exercise.data.name, muscleGroup: exercise.data.muscleGroup as MuscleGroup },
    records: own,
    substitutes: substitutesSection,
  };
}

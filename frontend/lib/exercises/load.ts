import "server-only";

import { serverApi } from "@/lib/api/server";
import { ApiError, unwrap } from "@/lib/api/errors";
import { MUSCLE_GROUPS, type ExercisePersonalRecords, type MuscleGroup } from "@/lib/api/extra-types";
import { settle, type Section } from "@/lib/stats/model";

/** Twój wynik w ćwiczeniu na liście: najlepszy szacowany 1RM i dzień, w którym padł. */
export type ExerciseMark = { e1rm: number; date: string };

export type CatalogExercise = { id: number; name: string; muscleGroup: MuscleGroup; mark: ExerciseMark | null };

export type SimilarItem = { id: number; name: string; similarity: number; mark: ExerciseMark | null };

function marksOf(records: ExercisePersonalRecords[]) {
  return new Map(
    records.map((r) => [r.exerciseId, { e1rm: Number(r.bestEstimatedOneRepMax), date: r.bestEstimatedOneRepMaxDate }]),
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

/** Podobne ćwiczenia: `unavailable`, gdy ćwiczenie nie ma jeszcze embeddingu (404). */
export type SimilarSection = { ok: true; data: SimilarItem[] } | { ok: false; reason: "unavailable" | "error" };

/** Karta ćwiczenia; `null`, gdy nie istnieje. */
export async function loadExerciseCard(id: number) {
  const api = await serverApi();
  const exercise = await api.GET("/exercise/{id}", { params: { path: { id } } });
  if (exercise.response.status === 404) return null;
  if (!exercise.data) throw ApiError.from(exercise.error, exercise.response);

  const [records, similar] = await Promise.all([
    settle(unwrap(api.GET("/stats/records"))),
    // Sieć może zawieść niezależnie od reszty karty.
    api.GET("/exercise/{id}/similar", { params: { path: { id } } }).catch(() => null),
  ]);
  const marks = records.ok ? marksOf(records.data) : new Map<number, ExerciseMark>();

  const own: Section<ExercisePersonalRecords | null> = records.ok
    ? { ok: true, data: records.data.find((r) => r.exerciseId === id) ?? null }
    : { ok: false };

  const similarSection: SimilarSection = similar?.data
    ? {
        ok: true,
        data: similar.data.map((s) => ({
          id: s.exercise.id,
          name: s.exercise.name,
          similarity: s.similarity,
          mark: marks.get(s.exercise.id) ?? null,
        })),
      }
    : { ok: false, reason: similar?.response.status === 404 ? "unavailable" : "error" };

  return {
    exercise: { id: exercise.data.id, name: exercise.data.name, muscleGroup: exercise.data.muscleGroup as MuscleGroup },
    records: own,
    similar: similarSection,
  };
}

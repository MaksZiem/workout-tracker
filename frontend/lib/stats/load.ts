import "server-only";

import { serverApi } from "@/lib/api/server";
import { ApiError, unwrap } from "@/lib/api/errors";
import type { ExercisePersonalRecords, MuscleGroup } from "@/lib/api/extra-types";
import { addDays } from "@/lib/planner/dates";
import { settle, sessionsOf, toMainExercise, weeklyStreak, type MainExercise } from "./model";
import { rangeBounds, type StatsRange } from "./range";

const MAIN_EXERCISES = 4;
/** Górny limit zapytań o postęp przy wyborze głównych ćwiczeń. */
const MAX_PROGRESS_REQUESTS = 40;

/** Dane przeglądu /stats. Każda sekcja wczytuje się niezależnie. */
export async function loadOverview(range: StatsRange, today: string) {
  const api = await serverApi();
  const bounds = rangeBounds(range, today);
  const query = { from: bounds.from, to: bounds.to };
  // Mapa aktywności przy „całym czasie” pokazuje ostatni rok.
  const activityFrom = bounds.from ?? addDays(today, -364);

  const [summary, muscleGroups, frequency, records, catalog, lastYear] = await Promise.all([
    settle(unwrap(api.GET("/stats/summary", { params: { query } }))),
    settle(unwrap(api.GET("/stats/muscle-groups", { params: { query } }))),
    settle(unwrap(api.GET("/stats/frequency", { params: { query: { from: activityFrom, to: bounds.to } } }))),
    settle(unwrap(api.GET("/stats/records"))),
    settle(unwrap(api.GET("/exercise"))),
    // Passa liczona zawsze z ostatniego roku, niezależnie od wybranego zakresu.
    settle(unwrap(api.GET("/stats/frequency", { params: { query: { from: addDays(today, -364), to: today } } }))),
  ]);

  const groupOf = new Map<number, MuscleGroup>(
    catalog.ok ? catalog.data.map((e) => [e.id, e.muscleGroup as MuscleGroup]) : [],
  );

  const main = records.ok
    ? await settle(loadMainExercises(api, records.data, query, groupOf))
    : ({ ok: false } as const);

  return {
    bounds,
    summary,
    muscleGroups,
    frequency,
    records,
    main,
    groupOf,
    streak: {
      weeks: lastYear.ok ? weeklyStreak(lastYear.data, today) : null,
      days: summary.ok ? summary.data.currentStreak : null,
    },
    hasHistory: (records.ok && records.data.length > 0) || (summary.ok && summary.data.totalWorkouts > 0),
  };
}

async function loadMainExercises(
  api: Awaited<ReturnType<typeof serverApi>>,
  records: ExercisePersonalRecords[],
  query: { from?: string; to: string },
  groupOf: Map<number, MuscleGroup>,
): Promise<MainExercise[]> {
  const candidates = records.slice(0, MAX_PROGRESS_REQUESTS);
  const progress = await Promise.all(
    candidates.map((r) =>
      unwrap(api.GET("/stats/exercise/{exerciseId}/progress", { params: { path: { exerciseId: r.exerciseId }, query } })),
    ),
  );

  return candidates
    .map((record, i) => ({ record, sessions: sessionsOf(progress[i]) }))
    // Bez ćwiczeń bez ciężaru: szacowane 1RM równe zero nic nie mówi o postępie.
    .filter(({ sessions }) => sessions.some((s) => s.estimatedOneRepMax > 0))
    // Najczęściej trenowane w zakresie; remis rozstrzyga świeższa sesja.
    .sort((a, b) => b.sessions.length - a.sessions.length || b.sessions.at(-1)!.date.localeCompare(a.sessions.at(-1)!.date))
    .slice(0, MAIN_EXERCISES)
    .map(({ record, sessions }) =>
      toMainExercise(
        record.exerciseId,
        record.exerciseName,
        groupOf.get(record.exerciseId) ?? null,
        sessions,
        record.bestEstimatedOneRepMaxDate,
      ),
    );
}

/** Dane szczegółu ćwiczenia. `null`, gdy ćwiczenie nie istnieje. */
export async function loadExercise(exerciseId: number, range: StatsRange, today: string) {
  const api = await serverApi();
  const bounds = rangeBounds(range, today);

  const exercise = await api.GET("/exercise/{id}", { params: { path: { id: exerciseId } } });
  if (exercise.response.status === 404 || !exercise.data) {
    if (exercise.response.status === 404) return null;
    throw ApiError.from(exercise.error, exercise.response);
  }

  const [progress, allTime, records] = await Promise.all([
    settle(
      unwrap(
        api.GET("/stats/exercise/{exerciseId}/progress", {
          params: { path: { exerciseId }, query: { from: bounds.from, to: bounds.to } },
        }),
      ),
    ),
    // Czy ćwiczenie ma jakąkolwiek historię (odróżnia „nigdy” od „nie w tym okresie”).
    settle(unwrap(api.GET("/stats/exercise/{exerciseId}/progress", { params: { path: { exerciseId } } }))),
    loadRecords(api, exerciseId),
  ]);

  return {
    exercise: { id: exercise.data.id, name: exercise.data.name, muscleGroup: exercise.data.muscleGroup as MuscleGroup },
    bounds,
    sessions: progress.ok ? { ok: true as const, data: sessionsOf(progress.data) } : progress,
    hasHistory: allTime.ok ? sessionsOf(allTime.data).length > 0 : true,
    records,
  };
}

/** Rekordy ćwiczenia; 404 z backendu oznacza „brak ukończonych serii”, nie błąd. */
async function loadRecords(api: Awaited<ReturnType<typeof serverApi>>, exerciseId: number) {
  try {
    const records = await unwrap(api.GET("/stats/exercise/{exerciseId}/records", { params: { path: { exerciseId } } }));
    return { ok: true as const, data: records };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { ok: true as const, data: null };
    return { ok: false as const };
  }
}

import "server-only";

import { serverApi } from "@/lib/api/server";
import type { ExerciseProgressPoint, MuscleGroup } from "@/lib/api/extra-types";
import { baselineFrom, localDate, previousFrom, type LogExercise, type LogWorkout } from "./model";

type Api = Awaited<ReturnType<typeof serverApi>>;

async function progressFor(api: Api, exerciseId: number): Promise<ExerciseProgressPoint[]> {
  const { data } = await api.GET("/stats/exercise/{exerciseId}/progress", {
    params: { path: { exerciseId } },
  });
  return data ?? [];
}

/** Trening z ćwiczeniami, poprzednimi wynikami i punktem odniesienia dla rekordów. */
export async function loadWorkout(workoutId: number): Promise<LogWorkout | null> {
  const api = await serverApi();
  const { data: workout } = await api.GET("/workout/{id}", { params: { path: { id: workoutId } } });
  if (!workout) return null;

  const workoutExercises = [...(workout.exercises ?? [])].sort((a, b) => a.order - b.order || a.id - b.id);
  const exerciseIds = [...new Set(workoutExercises.map((we) => we.exercise.id))];
  const progress = new Map(
    await Promise.all(exerciseIds.map(async (id) => [id, await progressFor(api, id)] as const)),
  );

  const exercises: LogExercise[] = workoutExercises.map((we) => {
    const points = progress.get(we.exercise.id) ?? [];
    return {
      key: `we-${we.id}`,
      id: we.id,
      order: we.order,
      exercise: {
        id: we.exercise.id,
        name: we.exercise.name,
        muscleGroup: we.exercise.muscleGroup as MuscleGroup,
      },
      previous: previousFrom(points, workout.date),
      baseline: baselineFrom(points, workout.date),
      status: "saved",
      sets: [...(we.sets ?? [])]
        .sort((a, b) => a.setNumber - b.setNumber || a.id - b.id)
        .map((set) => ({
          key: `set-${set.id}`,
          id: set.id,
          setNumber: set.setNumber,
          weight: Number(set.weight),
          reps: set.reps,
          restSeconds: set.restSeconds ?? null,
          completed: set.completed,
          touched: false,
          status: "saved" as const,
        })),
    };
  });

  return { id: workout.id, date: workout.date, createdAt: workout.createdAt, exercises };
}

export type PlannedItem = {
  id: number;
  templateName: string | null;
  exerciseCount: number;
  setCount: number;
  muscleGroups: MuscleGroup[];
};

export type StartedItem = {
  id: number;
  createdAt: string;
  exerciseCount: number;
  setCount: number;
  doneCount: number;
  muscleGroups: MuscleGroup[];
};

/** Dane ekranu wyboru: plany PLANNED na dziś i treningi już rozpoczęte dziś. */
export async function loadToday() {
  const api = await serverApi();
  const today = localDate();

  const [{ data: scheduled }, { data: workouts }] = await Promise.all([
    api.GET("/planner/today", { params: { query: { date: today } } }),
    api.GET("/workout", { params: { query: { from: today, to: today } } }),
  ]);

  const planned: PlannedItem[] = (scheduled ?? [])
    .filter((item) => item.status === "PLANNED")
    .map((item) => {
      const exercises = item.template?.exercises ?? [];
      return {
        id: item.id,
        templateName: item.template?.name ?? null,
        exerciseCount: exercises.length,
        setCount: exercises.reduce((sum, te) => sum + (te.targetSets ?? 0), 0),
        muscleGroups: unique(exercises.map((te) => te.exercise?.muscleGroup as MuscleGroup)),
      };
    });

  const details = await Promise.all(
    // Tylko treningi w trakcie; zakończone (finishedAt) nie wracają do wyboru.
    (workouts ?? [])
      .filter((w) => !w.finishedAt)
      .map((w) => api.GET("/workout/{id}", { params: { path: { id: w.id } } })),
  );
  const started: StartedItem[] = details
    .map(({ data }) => data)
    .filter((w): w is NonNullable<typeof w> => !!w)
    .map((w) => {
      const exercises = w.exercises ?? [];
      const sets = exercises.flatMap((we) => we.sets ?? []);
      return {
        id: w.id,
        createdAt: w.createdAt,
        exerciseCount: exercises.length,
        setCount: sets.length,
        doneCount: sets.filter((s) => s.completed).length,
        muscleGroups: unique(exercises.map((we) => we.exercise.muscleGroup as MuscleGroup)),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { today, planned, started };
}

function unique<T>(values: (T | undefined)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== undefined && v !== null))];
}

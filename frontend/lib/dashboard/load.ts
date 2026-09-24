import "server-only";

import { serverApi } from "@/lib/api/server";
import { unwrap } from "@/lib/api/errors";
import type { ExercisePersonalRecords, MuscleGroup, ScheduledWorkout, Workout } from "@/lib/api/extra-types";
import { addDays, weekStart } from "@/lib/planner/dates";
import type { PlannerEntry } from "@/lib/planner/model";
import { settle, weeklyStreak } from "@/lib/stats/model";

/** Ile dni wstecz szukamy niezakończonego treningu do „Kontynuuj”. */
const RESUME_DAYS = 2;
const RECENT_WORKOUTS = 5;
const FRESH_RECORD_DAYS = 30;
/** Horyzont „zaplanowałeś coś” dla listy Na start. */
const SCHEDULE_HORIZON_DAYS = 56;

export type TodayItem =
  | {
      kind: "inProgress";
      workoutId: number;
      date: string;
      createdAt: string;
      title: string | null;
      exerciseCount: number;
      setCount: number;
      doneCount: number;
    }
  | {
      kind: "planned";
      scheduledId: number;
      title: string | null;
      exerciseCount: number;
      setCount: number;
      muscleGroups: MuscleGroup[];
    }
  | {
      kind: "done";
      workoutId: number;
      title: string | null;
      exerciseCount: number;
      doneCount: number;
      volume: number;
    };

export type RecentWorkout = {
  id: number;
  date: string;
  exercises: string[];
  doneSets: number;
  volume: number;
  minutes: number | null;
  inProgress: boolean;
};

export type FreshRecord = {
  exerciseId: number;
  exerciseName: string;
  kind: "e1rm" | "maxWeight";
  value: number;
  date: string;
};

type WorkoutDetail = Workout;

function setsOf(w: WorkoutDetail) {
  return (w.exercises ?? []).flatMap((we) => we.sets ?? []);
}

function volumeOf(w: WorkoutDetail) {
  return setsOf(w)
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + Number(s.weight) * s.reps, 0);
}

function unique<T>(values: (T | null | undefined)[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== undefined && v !== null))];
}

/** Dane pulpitu. Każda sekcja wczytuje się niezależnie. */
export async function loadDashboard(today: string) {
  const api = await serverApi();
  const monday = weekStart(today);
  const sunday = addDays(monday, 6);

  const [todayPlan, workouts, scheduled, frequency, records, plans] = await Promise.all([
    settle(unwrap(api.GET("/planner/today", { params: { query: { date: today } } }))),
    settle(unwrap(api.GET("/workout"))),
    settle(
      unwrap(
        api.GET("/planner/scheduled", {
          params: { query: { from: monday, to: addDays(today, SCHEDULE_HORIZON_DAYS) } },
        }),
      ),
    ),
    settle(unwrap(api.GET("/stats/frequency", { params: { query: { from: addDays(today, -364), to: today } } }))),
    settle(unwrap(api.GET("/stats/records"))),
    settle(unwrap(api.GET("/plan"))),
  ]);

  // Szczegóły (ćwiczenia i serie): ostatnie treningi + niezakończone z ostatnich dni.
  const list = workouts.ok ? workouts.data : [];
  const resumeFrom = addDays(today, -RESUME_DAYS);
  const detailIds = unique([
    ...list.filter((w) => w.finishedAt).slice(0, RECENT_WORKOUTS).map((w) => w.id),
    ...list.filter((w) => !w.finishedAt && w.date >= resumeFrom && w.date <= today).map((w) => w.id),
    ...list.filter((w) => w.date === today).map((w) => w.id),
  ]);
  const details = new Map<number, WorkoutDetail>();
  await Promise.all(
    detailIds.map(async (id) => {
      const { data } = await api.GET("/workout/{id}", { params: { path: { id } } });
      if (data) details.set(id, data);
    }),
  );

  return {
    today: todayPlan.ok && workouts.ok ? { ok: true as const, data: todayItems(today, todayPlan.data, list, details) } : { ok: false as const },
    week: scheduled.ok ? { ok: true as const, data: weekEntries(scheduled.data, monday, sunday) } : { ok: false as const },
    // Zielony dzień = zakończony trening; rozpoczęty jeszcze nie jest „zrobiony”.
    weekTrained: new Set(list.filter((w) => w.finishedAt && w.date >= monday && w.date <= sunday).map((w) => w.date)),
    streak: frequency.ok ? weeklyStreak(frequency.data, today) : null,
    recent: workouts.ok
      ? { ok: true as const, data: recentWorkouts(list, details) }
      : { ok: false as const },
    records: records.ok ? { ok: true as const, data: freshRecords(records.data, today) } : { ok: false as const },
    onboarding: {
      workout: workouts.ok ? list.length > 0 : true,
      plan: plans.ok ? plans.data.length > 0 : true,
      schedule: scheduled.ok ? scheduled.data.length > 0 : true,
    },
  };
}

function todayItems(
  today: string,
  plan: ScheduledWorkout[],
  list: { id: number; date: string; finishedAt?: string | null }[],
  details: Map<number, WorkoutDetail>,
): TodayItem[] {
  // Nazwa szablonu dla treningu uruchomionego z planera.
  const titleByWorkout = new Map<number, string>();
  for (const item of plan) if (item.workout?.id && item.template?.name) titleByWorkout.set(item.workout.id, item.template.name);

  const inProgress: TodayItem[] = list
    .filter((w) => !w.finishedAt && w.date >= addDays(today, -RESUME_DAYS) && w.date <= today)
    .map((w) => details.get(w.id))
    .filter((w): w is WorkoutDetail => !!w)
    .map((w) => {
      const sets = setsOf(w);
      return {
        kind: "inProgress" as const,
        workoutId: w.id,
        date: w.date,
        createdAt: w.createdAt,
        title: titleByWorkout.get(w.id) ?? null,
        exerciseCount: (w.exercises ?? []).length,
        setCount: sets.length,
        doneCount: sets.filter((s) => s.completed).length,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const planned: TodayItem[] = plan
    .filter((item) => item.status === "PLANNED")
    .map((item) => {
      const exercises = item.template?.exercises ?? [];
      return {
        kind: "planned" as const,
        scheduledId: item.id,
        title: item.template?.name ?? null,
        exerciseCount: exercises.length,
        setCount: exercises.reduce((sum, te) => sum + (te.targetSets ?? 0), 0),
        muscleGroups: unique(exercises.map((te) => te.exercise?.muscleGroup as MuscleGroup | undefined)),
      };
    });

  const done: TodayItem[] = list
    .filter((w) => w.date === today && w.finishedAt)
    .map((w) => details.get(w.id))
    .filter((w): w is WorkoutDetail => !!w)
    .map((w) => ({
      kind: "done" as const,
      workoutId: w.id,
      title: titleByWorkout.get(w.id) ?? null,
      exerciseCount: (w.exercises ?? []).length,
      doneCount: setsOf(w).filter((s) => s.completed).length,
      volume: volumeOf(w),
    }));

  return [...inProgress, ...planned, ...done];
}

function weekEntries(
  items: ScheduledWorkout[],
  monday: string,
  sunday: string,
): PlannerEntry[] {
  return items
    .filter((item) => item.date >= monday && item.date <= sunday)
    .map((item) => ({
      id: item.id,
      date: item.date,
      status: item.status,
      templateId: item.template?.id ?? null,
      templateName: item.template?.name ?? null,
      exerciseCount: 0,
      muscleGroups: [],
      workoutId: item.workout?.id ?? null,
    }));
}

function recentWorkouts(
  list: { id: number; date: string; finishedAt?: string | null }[],
  details: Map<number, WorkoutDetail>,
): RecentWorkout[] {
  // Tylko zakończone: niezakończony trening jest już w karcie „Dziś”.
  return list
    .filter((w) => w.finishedAt)
    .slice(0, RECENT_WORKOUTS)
    .map((w) => details.get(w.id))
    .filter((w): w is WorkoutDetail => !!w)
    .map((w) => {
      const exercises = [...(w.exercises ?? [])].sort((a, b) => a.order - b.order);
      const minutes =
        w.finishedAt && w.createdAt
          ? Math.round((Date.parse(w.finishedAt) - Date.parse(w.createdAt)) / 60_000)
          : null;
      return {
        id: w.id,
        date: w.date,
        exercises: exercises.map((we) => we.exercise.name),
        doneSets: setsOf(w).filter((s) => s.completed).length,
        volume: volumeOf(w),
        // Czas ma sens tylko dla treningu zapisywanego na żywo (nie dopisanego po fakcie).
        minutes: minutes !== null && minutes > 0 && minutes < 6 * 60 ? minutes : null,
        inProgress: !w.finishedAt,
      };
    });
}

/** Rekordy pobite w ostatnich 30 dniach, najświeższe na górze. */
function freshRecords(records: ExercisePersonalRecords[], today: string): FreshRecord[] {
  const since = addDays(today, -(FRESH_RECORD_DAYS - 1));
  return records
    .flatMap((r): FreshRecord[] => {
      if (r.bestEstimatedOneRepMax > 0 && r.bestEstimatedOneRepMaxDate >= since)
        return [{ exerciseId: r.exerciseId, exerciseName: r.exerciseName, kind: "e1rm", value: r.bestEstimatedOneRepMax, date: r.bestEstimatedOneRepMaxDate }];
      if (r.maxWeight > 0 && r.maxWeightDate >= since)
        return [{ exerciseId: r.exerciseId, exerciseName: r.exerciseName, kind: "maxWeight", value: r.maxWeight, date: r.maxWeightDate }];
      return [];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

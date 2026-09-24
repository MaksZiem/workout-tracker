import type { ExercisePersonalRecords, MuscleGroup, Workout } from "@/lib/api/extra-types";
import { addDays, weekStart } from "@/lib/planner/dates";

/** Czas ma sens tylko dla treningu zapisywanego na żywo (nie dopisanego po fakcie). */
const MAX_MINUTES = 6 * 60;

export function minutesOf(w: Pick<Workout, "createdAt" | "finishedAt">) {
  if (!w.finishedAt || !w.createdAt) return null;
  const minutes = Math.round((Date.parse(w.finishedAt) - Date.parse(w.createdAt)) / 60_000);
  return minutes > 0 && minutes < MAX_MINUTES ? minutes : null;
}

function setsOf(w: Workout) {
  return (w.exercises ?? []).flatMap((we) => we.sets ?? []);
}

function volumeOf(sets: { weight: number | string; reps: number; completed: boolean }[]) {
  return sets.filter((s) => s.completed).reduce((sum, s) => sum + Number(s.weight) * s.reps, 0);
}

export type HistoryRow = {
  id: number;
  date: string;
  exercises: string[];
  doneSets: number;
  volume: number;
  minutes: number | null;
  inProgress: boolean;
};

export type HistoryWeek = { start: string; end: string; rows: HistoryRow[] };

export type MonthSummary = { workouts: number; sets: number; volume: number; days: number };

export function toRow(w: Workout): HistoryRow {
  const exercises = [...(w.exercises ?? [])].sort((a, b) => a.order - b.order);
  return {
    id: w.id,
    date: w.date,
    exercises: exercises.map((we) => we.exercise.name),
    doneSets: setsOf(w).filter((s) => s.completed).length,
    volume: volumeOf(setsOf(w)),
    minutes: minutesOf(w),
    inProgress: !w.finishedAt,
  };
}

/** Tygodnie (od poniedziałku), najnowsze na górze; w tygodniu treningi od najnowszego. */
export function toWeeks(rows: HistoryRow[]): HistoryWeek[] {
  const weeks = new Map<string, HistoryRow[]>();
  for (const row of [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)) {
    const start = weekStart(row.date);
    weeks.set(start, [...(weeks.get(start) ?? []), row]);
  }
  return [...weeks.entries()].map(([start, list]) => ({ start, end: addDays(start, 6), rows: list }));
}

export function summarize(rows: HistoryRow[]): MonthSummary {
  return {
    workouts: rows.length,
    sets: rows.reduce((sum, r) => sum + r.doneSets, 0),
    volume: rows.reduce((sum, r) => sum + r.volume, 0),
    days: new Set(rows.map((r) => r.date)).size,
  };
}

export type RecordKind = "e1rm" | "maxWeight" | "bestSet";

export type DetailSet = {
  id: number;
  number: number;
  weight: number;
  reps: number;
  completed: boolean;
  /** Rekordy, które padły właśnie w tej serii (tylko gdy data rekordu = data treningu). */
  records: RecordKind[];
};

export type DetailExercise = {
  id: number;
  exerciseId: number;
  name: string;
  muscleGroup: MuscleGroup;
  sets: DetailSet[];
  doneSets: number;
  volume: number;
};

export type WorkoutDetail = {
  id: number;
  date: string;
  notes: string;
  createdAt: string;
  finishedAt: string | null;
  minutes: number | null;
  exercises: DetailExercise[];
  totalSets: number;
  doneSets: number;
  volume: number;
};

const epley = (weight: number, reps: number) => weight * (1 + reps / 30);

/** Wartości porównujemy z tolerancją: backend liczy je z liczb zmiennoprzecinkowych. */
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/**
 * Serie z rekordami: medal dostaje najlepsza ukończona seria treningu tylko wtedy,
 * gdy rekord padł tego dnia i jej wynik jest równy wartości rekordu (jak w backendzie:
 * ciężar, ciężar × powtórzenia, e1RM wzorem Epleya).
 */
export function toDetail(w: Workout, records: ExercisePersonalRecords[]): WorkoutDetail {
  const byExercise = new Map(records.map((r) => [r.exerciseId, r]));
  const exercises = [...(w.exercises ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((we): DetailExercise => {
      const sets: DetailSet[] = [...(we.sets ?? [])]
        .sort((a, b) => a.setNumber - b.setNumber || a.id - b.id)
        .map((s) => ({ id: s.id, number: s.setNumber, weight: Number(s.weight), reps: s.reps, completed: s.completed, records: [] }));
      const record = byExercise.get(we.exercise.id);
      const done = sets.filter((s) => s.completed && s.weight > 0);
      const best = (score: (s: DetailSet) => number) =>
        done.reduce<DetailSet | null>((top, s) => (!top || score(s) > score(top) ? s : top), null);
      if (record && done.length) {
        const marks: [RecordKind, string, number, (s: DetailSet) => number][] = [
          ["e1rm", record.bestEstimatedOneRepMaxDate, Number(record.bestEstimatedOneRepMax), (s) => epley(s.weight, s.reps)],
          ["maxWeight", record.maxWeightDate, Number(record.maxWeight), (s) => s.weight],
          ["bestSet", record.bestVolumeDate, Number(record.bestVolumeInSingleSet), (s) => s.weight * s.reps],
        ];
        for (const [kind, date, value, score] of marks) {
          const top = date === w.date ? best(score) : null;
          if (top && same(score(top), value)) top.records.push(kind);
        }
      }
      return {
        id: we.id,
        exerciseId: we.exercise.id,
        name: we.exercise.name,
        muscleGroup: we.exercise.muscleGroup as MuscleGroup,
        sets,
        doneSets: sets.filter((s) => s.completed).length,
        volume: volumeOf(sets),
      };
    });

  return {
    id: w.id,
    date: w.date,
    notes: w.notes ?? "",
    createdAt: w.createdAt,
    finishedAt: w.finishedAt ?? null,
    minutes: minutesOf(w),
    exercises,
    totalSets: exercises.reduce((sum, e) => sum + e.sets.length, 0),
    doneSets: exercises.reduce((sum, e) => sum + e.doneSets, 0),
    volume: exercises.reduce((sum, e) => sum + e.volume, 0),
  };
}

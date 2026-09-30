import { ExerciseSet } from 'src/workout/exercise-set.entity';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';
import { ScheduledWorkoutStatus } from '../enums/scheduled-workout-status.enum';

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function estimateOneRepMax(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function toProgressPoint(we: WorkoutExercise) {
  const completedSets = we.sets.filter((s) => s.completed);

  const topWeight = completedSets.length
    ? Math.max(...completedSets.map((s) => s.weight))
    : 0;

  const volume = completedSets.reduce((acc, x) => {
    return acc + x.weight * x.reps;
  }, 0);

  const estimatedOneRepMax = completedSets.length
    ? Math.max(...completedSets.map((s) => estimateOneRepMax(s.weight, s.reps)))
    : 0;

  return {
    date: we.workout.date,
    sets: completedSets.map((s) => ({weight: s.weight, reps: s.reps})),
    topWeight,
    volume,
    estimatedOneRepMax
  }
}

export function computePersonalRecords(sets: ExerciseSet[]) {
  let maxWeightSet = sets[0];
  let bestVolumeSet = sets[0];
  let bestOneRepMax = 0;
  let bestOneRepMaxSet = sets[0];

  for (const set of sets) {
    if (set.weight > maxWeightSet.weight) {
      maxWeightSet = set;
    }

    if (set.weight * set.reps > bestVolumeSet.weight * bestVolumeSet.reps) {
      bestVolumeSet = set;
    }

    const oneRepMax = estimateOneRepMax(set.weight, set.reps);
    if (oneRepMax > bestOneRepMax) {
      bestOneRepMax = oneRepMax;
      bestOneRepMaxSet = set;
    }
  }

  return {
    maxWeight: maxWeightSet.weight,
    maxWeightDate: maxWeightSet.workoutExercise.workout.date,
    maxWeightExercise: maxWeightSet.workoutExercise.exercise.name,
    bestVolumeInSingleSet: bestVolumeSet.weight * bestVolumeSet.reps,
    bestVolumeDate: bestVolumeSet.workoutExercise.workout.date,
    bestEstimatedOneRepMax: bestOneRepMax,
    bestEstimatedOneRepMaxDate: bestOneRepMaxSet.workoutExercise.workout.date,
    // Seria, z której policzono e1RM: UI pokazuje na niej rachunek wzoru Epleya.
    bestEstimatedOneRepMaxWeight: Number(bestOneRepMaxSet.weight),
    bestEstimatedOneRepMaxReps: bestOneRepMaxSet.reps,
  };
}

/** Poniedziałek tygodnia (pon–niedz.), do którego należy data. */
export function weekStart(dateString: string): string {
  const day = new Date(`${dateString}T00:00:00Z`).getUTCDay();
  return addDays(dateString, -((day + 6) % 7));
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
}

/** Ukończona seria spłaszczona do tego, czego potrzebują statystyki. */
export type SetRow = {
  workoutId: number;
  date: string;
  exerciseId: number;
  exerciseName: string;
  weight: number;
  reps: number;
};

export type WeeklyStats = {
  weekStart: string;
  workouts: number;
  sets: number;
  volume: number;
};

/**
 * Gęsta lista tygodni od `from` do `to` (bez dziur). Bez `from` - od tygodnia
 * pierwszego treningu; bez żadnych treningów - pusta lista.
 */
export function computeWeeklyStats(
  workoutDates: string[],
  sets: Pick<SetRow, 'date' | 'weight' | 'reps'>[],
  to: string,
  from?: string,
): WeeklyStats[] {
  const start = from ?? [...workoutDates].sort()[0];
  if (!start) return [];

  const byWeek = new Map<string, WeeklyStats>();
  for (let week = weekStart(start); week <= to; week = addDays(week, 7)) {
    byWeek.set(week, { weekStart: week, workouts: 0, sets: 0, volume: 0 });
  }
  for (const date of workoutDates) {
    const week = byWeek.get(weekStart(date));
    if (week) week.workouts += 1;
  }
  for (const set of sets) {
    const week = byWeek.get(weekStart(set.date));
    if (!week) continue;
    week.sets += 1;
    week.volume += set.weight * set.reps;
  }

  return Array.from(byWeek.values());
}

export const REP_RANGES = ['STRENGTH', 'HYPERTROPHY', 'ENDURANCE'] as const;
export type RepRange = (typeof REP_RANGES)[number];

export function repRangeOf(reps: number): RepRange {
  if (reps <= 5) return 'STRENGTH';
  if (reps <= 12) return 'HYPERTROPHY';
  return 'ENDURANCE';
}

/** Liczba ukończonych serii w zakresach 1–5, 6–12 i 13+ powtórzeń. */
export function computeRepRanges(sets: Pick<SetRow, 'reps'>[]) {
  const counts = new Map<RepRange, number>(REP_RANGES.map((r) => [r, 0]));
  for (const set of sets) {
    const range = repRangeOf(set.reps);
    counts.set(range, counts.get(range)! + 1);
  }
  return REP_RANGES.map((range) => ({ range, sets: counts.get(range)! }));
}

export const REP_RECORD_TARGETS = [1, 3, 5, 8, 10, 12] as const;

export type RepRecord =
  | { reps: number; weight: number; actualReps: number; date: string }
  | { reps: number; weight: null; actualReps: null; date: null };

/**
 * Rekord dla N powtórzeń: największy ciężar z serii o co najmniej N powtórzeniach
 * (seria 100 kg × 8 jest też rekordem 5RM). Przy remisie wygrywa wcześniejsza seria.
 */
export function computeRepRecords(
  sets: Pick<SetRow, 'date' | 'weight' | 'reps'>[],
): RepRecord[] {
  const weighted = sets
    .filter((s) => s.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  return REP_RECORD_TARGETS.map((reps) => {
    let best: (typeof weighted)[number] | null = null;
    for (const set of weighted) {
      if (set.reps >= reps && (!best || set.weight > best.weight)) best = set;
    }
    return best
      ? { reps, weight: best.weight, actualReps: best.reps, date: best.date }
      : { reps, weight: null, actualReps: null, date: null };
  });
}

/** Ćwiczenie musi być trenowane w tym oknie, żeby zastój miał znaczenie. */
export const STAGNATION_ACTIVE_DAYS = 21;
/** Tyle dni bez nowego szacowanego 1RM uznajemy za zastój. */
export const STAGNATION_DAYS = 42;
/** Minimalna liczba sesji od rekordu - pojedyncza sesja to jeszcze nie zastój. */
export const STAGNATION_MIN_SESSIONS = 3;

export type StagnantExercise = {
  exerciseId: number;
  exerciseName: string;
  bestEstimatedOneRepMax: number;
  /** Seria rekordu (ciężar × powtórzenia), z której policzono e1RM. */
  bestWeight: number;
  bestReps: number;
  bestDate: string;
  weeksSinceBest: number;
  sessionsSince: number;
  lastSessionDate: string;
};

/** Ćwiczenia, w których szacowany 1RM nie wzrósł od dłuższego czasu, najdłuższy zastój pierwszy. */
export function computeStagnation(sets: SetRow[], today: string): StagnantExercise[] {
  const byExercise = new Map<number, SetRow[]>();
  for (const set of sets) {
    if (set.weight <= 0) continue;
    const group = byExercise.get(set.exerciseId) ?? [];
    group.push(set);
    byExercise.set(set.exerciseId, group);
  }

  const result: StagnantExercise[] = [];
  for (const [exerciseId, exerciseSets] of byExercise) {
    // Pierwsze osiągnięcie najlepszego wyniku: wyrównanie rekordu go nie odświeża.
    let best = exerciseSets[0];
    let bestValue = 0;
    for (const set of [...exerciseSets].sort((a, b) => a.date.localeCompare(b.date))) {
      const value = estimateOneRepMax(set.weight, set.reps);
      if (value > bestValue) {
        bestValue = value;
        best = set;
      }
    }

    const sessionsSince = new Set(
      exerciseSets.filter((s) => s.date > best.date).map((s) => s.workoutId),
    ).size;
    const lastSessionDate = exerciseSets.reduce((last, s) => (s.date > last ? s.date : last), best.date);
    const daysSinceBest = daysBetween(best.date, today);

    if (
      daysBetween(lastSessionDate, today) <= STAGNATION_ACTIVE_DAYS &&
      daysSinceBest > STAGNATION_DAYS &&
      sessionsSince >= STAGNATION_MIN_SESSIONS
    ) {
      result.push({
        exerciseId,
        exerciseName: best.exerciseName,
        bestEstimatedOneRepMax: bestValue,
        bestWeight: Number(best.weight),
        bestReps: best.reps,
        bestDate: best.date,
        weeksSinceBest: Math.floor(daysSinceBest / 7),
        sessionsSince,
        lastSessionDate,
      });
    }
  }

  return result.sort((a, b) => a.bestDate.localeCompare(b.bestDate));
}

export type Adherence = {
  completed: number;
  skipped: number;
  missed: number;
  upcoming: number;
  /** Udział zrealizowanych wśród tych, które już powinny się odbyć; null, gdy takich nie ma. */
  rate: number | null;
};

export function computeAdherence(
  scheduled: { date: string; status: ScheduledWorkoutStatus }[],
  today: string,
): Adherence {
  const result = { completed: 0, skipped: 0, missed: 0, upcoming: 0 };
  for (const s of scheduled) {
    if (s.status === ScheduledWorkoutStatus.COMPLETED) result.completed += 1;
    else if (s.status === ScheduledWorkoutStatus.SKIPPED) result.skipped += 1;
    else if (s.status === ScheduledWorkoutStatus.PLANNED && s.date < today) result.missed += 1;
    else result.upcoming += 1;
  }
  const due = result.completed + result.skipped + result.missed;
  return { ...result, rate: due ? result.completed / due : null };
}

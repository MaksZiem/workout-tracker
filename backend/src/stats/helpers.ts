import { ExerciseSet } from 'src/workout/exercise-set.entity';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
    ? Math.max(...completedSets.map((s) => s.weight * (1 + s.reps / 30)))
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

    const oneRepMax = set.weight * (1 + set.reps / 30);
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
  };
}

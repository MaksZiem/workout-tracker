import { ExerciseSet } from 'src/workout/exercise-set.entity';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';
import {
  addDays,
  computePersonalRecords,
  daysBetween,
  estimateOneRepMax,
  repRangeOf,
  toProgressPoint,
} from './helpers';

function set(
  weight: number,
  reps: number,
  date: string,
  completed = true,
): ExerciseSet {
  return {
    weight,
    reps,
    completed,
    workoutExercise: {
      workout: { date },
      exercise: { name: 'Bench press' },
    },
  } as unknown as ExerciseSet;
}

describe('addDays', () => {
  it('moves to the next day', () => {
    expect(addDays('2026-10-05', 1)).toBe('2026-10-06');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('goes back with a negative number', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('daysBetween', () => {
  it('counts whole days between two dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-22')).toBe(21);
  });

  it('is negative when the dates are reversed', () => {
    expect(daysBetween('2026-10-22', '2026-10-01')).toBe(-21);
  });
});

describe('estimateOneRepMax', () => {
  it('uses the Epley formula', () => {
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 2);
  });

  it('adds a little even for a single rep', () => {
    expect(estimateOneRepMax(100, 1)).toBeCloseTo(103.33, 2);
  });
});

describe('repRangeOf', () => {
  it.each([
    [1, 'STRENGTH'],
    [5, 'STRENGTH'],
    [6, 'HYPERTROPHY'],
    [12, 'HYPERTROPHY'],
    [13, 'ENDURANCE'],
  ])('%i reps counts as %s', (reps, range) => {
    expect(repRangeOf(reps)).toBe(range);
  });
});

describe('toProgressPoint', () => {
  it('ignores sets that were not completed', () => {
    const point = toProgressPoint({
      workout: { date: '2026-10-05' },
      sets: [set(80, 8, '2026-10-05'), set(100, 8, '2026-10-05', false)],
    } as unknown as WorkoutExercise);

    expect(point).toMatchObject({
      date: '2026-10-05',
      topWeight: 80,
      volume: 640,
      sets: [{ weight: 80, reps: 8 }],
    });
    expect(point.estimatedOneRepMax).toBeCloseTo(101.33, 2);
  });

  it('returns zeros when nothing was completed', () => {
    const point = toProgressPoint({
      workout: { date: '2026-10-05' },
      sets: [set(80, 8, '2026-10-05', false)],
    } as unknown as WorkoutExercise);

    expect(point).toMatchObject({
      topWeight: 0,
      volume: 0,
      estimatedOneRepMax: 0,
    });
  });
});

describe('computePersonalRecords', () => {
  it('finds the heaviest set, the best volume and the best e1RM separately', () => {
    const records = computePersonalRecords([
      set(100, 1, '2026-10-01'),
      set(80, 10, '2026-10-08'),
      set(90, 5, '2026-10-15'),
    ]);

    expect(records).toMatchObject({
      maxWeight: 100,
      maxWeightDate: '2026-10-01',
      maxWeightExercise: 'Bench press',
      bestVolumeInSingleSet: 800,
      bestVolumeDate: '2026-10-08',
      bestEstimatedOneRepMaxDate: '2026-10-08',
      bestEstimatedOneRepMaxWeight: 80,
      bestEstimatedOneRepMaxReps: 10,
    });
  });

  it('keeps the first record when a later set only ties it', () => {
    const records = computePersonalRecords([
      set(100, 5, '2026-10-01'),
      set(100, 5, '2026-10-08'),
    ]);

    expect(records.maxWeightDate).toBe('2026-10-01');
    expect(records.bestEstimatedOneRepMaxDate).toBe('2026-10-01');
  });
});

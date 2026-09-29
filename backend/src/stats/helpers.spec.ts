import { ScheduledWorkoutStatus } from '../enums/scheduled-workout-status.enum';
import {
  computeAdherence,
  computeRepRanges,
  computeRepRecords,
  computeStagnation,
  computeWeeklyStats,
  SetRow,
  weekStart,
} from './helpers';

const row = (date: string, weight: number, reps: number, workoutId = 0): SetRow => ({
  workoutId: workoutId || Number(date.replace(/-/g, '')),
  date,
  exerciseId: 1,
  exerciseName: 'Wyciskanie',
  weight,
  reps,
});

describe('weekStart', () => {
  it('zwraca poniedziałek tygodnia', () => {
    expect(weekStart('2026-09-28')).toBe('2026-09-28'); // poniedziałek
    expect(weekStart('2026-09-30')).toBe('2026-09-28');
    expect(weekStart('2026-10-04')).toBe('2026-09-28'); // niedziela
  });
});

describe('computeWeeklyStats', () => {
  it('buduje gęstą listę tygodni z zerami', () => {
    const weeks = computeWeeklyStats(
      ['2026-09-01', '2026-09-15'],
      [
        { date: '2026-09-01', weight: 100, reps: 5 },
        { date: '2026-09-15', weight: 50, reps: 10 },
      ],
      '2026-09-20',
    );
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-08-31', '2026-09-07', '2026-09-14']);
    expect(weeks.map((w) => w.volume)).toEqual([500, 0, 500]);
    expect(weeks.map((w) => w.workouts)).toEqual([1, 0, 1]);
  });

  it('bez treningów i bez from zwraca pustą listę', () => {
    expect(computeWeeklyStats([], [], '2026-09-20')).toEqual([]);
  });
});

describe('computeRepRanges', () => {
  it('dzieli serie na 1–5, 6–12 i 13+', () => {
    expect(computeRepRanges([{ reps: 5 }, { reps: 6 }, { reps: 12 }, { reps: 13 }])).toEqual([
      { range: 'STRENGTH', sets: 1 },
      { range: 'HYPERTROPHY', sets: 2 },
      { range: 'ENDURANCE', sets: 1 },
    ]);
  });
});

describe('computeRepRecords', () => {
  it('seria z większą liczbą powtórzeń liczy się też dla mniejszych N', () => {
    const records = computeRepRecords([
      { date: '2026-09-01', weight: 100, reps: 8 },
      { date: '2026-09-08', weight: 110, reps: 3 },
    ]);
    expect(records.find((r) => r.reps === 1)).toMatchObject({ weight: 110, actualReps: 3 });
    expect(records.find((r) => r.reps === 5)).toMatchObject({ weight: 100, actualReps: 8 });
    expect(records.find((r) => r.reps === 8)).toMatchObject({ weight: 100, date: '2026-09-01' });
    expect(records.find((r) => r.reps === 10)).toMatchObject({ weight: null });
  });

  it('pomija serie bez ciężaru', () => {
    expect(computeRepRecords([{ date: '2026-09-01', weight: 0, reps: 20 }]).every((r) => r.weight === null)).toBe(true);
  });
});

describe('computeStagnation', () => {
  const today = '2026-09-29';

  it('wykrywa brak nowego 1RM od ponad 6 tygodni przy regularnych sesjach', () => {
    const result = computeStagnation(
      [
        row('2026-07-01', 100, 5),
        row('2026-08-01', 95, 5),
        row('2026-08-20', 97.5, 5),
        row('2026-09-25', 100, 5), // wyrównanie rekordu, nie nowy rekord
      ],
      today,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ bestDate: '2026-07-01', sessionsSince: 3, weeksSinceBest: 12 });
  });

  it('nie zgłasza ćwiczenia z niedawnym rekordem', () => {
    expect(
      computeStagnation([row('2026-07-01', 100, 5), row('2026-08-01', 95, 5), row('2026-09-25', 102.5, 5)], today),
    ).toEqual([]);
  });

  it('nie zgłasza ćwiczenia, którego już się nie trenuje', () => {
    expect(
      computeStagnation([row('2026-05-01', 100, 5), row('2026-06-01', 95, 5), row('2026-06-10', 95, 5), row('2026-07-01', 95, 5)], today),
    ).toEqual([]);
  });
});

describe('computeAdherence', () => {
  it('liczy przegapione tylko z przeszłości i pomija przyszłe we wskaźniku', () => {
    const result = computeAdherence(
      [
        { date: '2026-09-20', status: ScheduledWorkoutStatus.COMPLETED },
        { date: '2026-09-22', status: ScheduledWorkoutStatus.COMPLETED },
        { date: '2026-09-24', status: ScheduledWorkoutStatus.SKIPPED },
        { date: '2026-09-26', status: ScheduledWorkoutStatus.PLANNED },
        { date: '2026-10-01', status: ScheduledWorkoutStatus.PLANNED },
      ],
      '2026-09-29',
    );
    expect(result).toEqual({ completed: 2, skipped: 1, missed: 1, upcoming: 1, rate: 0.5 });
  });

  it('bez zaplanowanych treningów wskaźnik jest pusty', () => {
    expect(computeAdherence([], '2026-09-29').rate).toBeNull();
  });
});

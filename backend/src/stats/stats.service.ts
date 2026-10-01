import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExerciseSet } from 'src/workout/exercise-set.entity';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';
import { Workout } from 'src/workout/workout.entity';
import { WorkoutService } from 'src/workout/workout.service';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  addDays,
  computeAdherence,
  computePersonalRecords,
  computeRepRanges,
  computeRepRecords,
  computeStagnation,
  computeWeeklyStats,
  SetRow,
  toProgressPoint,
} from './helpers';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { ScheduledWorkout } from 'src/planner/scheduled-workout.entity';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Workout) private workoutRepo: Repository<Workout>,
    @InjectRepository(WorkoutExercise)
    private workoutExerciseRepo: Repository<WorkoutExercise>,
    @InjectRepository(ExerciseSet)
    private exerciseSetRepo: Repository<ExerciseSet>,
    @InjectRepository(ScheduledWorkout)
    private scheduledRepo: Repository<ScheduledWorkout>,
    // private workoutService: WorkoutService
  ) {}

  async getExerciseProgress(
    userId: number,
    exerciseId: number,
    from?: string,
    to?: string,
  ) {
    const workoutWhere = this.workoutWhere(userId, from, to);

    const where: FindOptionsWhere<WorkoutExercise> = {
      exercise: { id: exerciseId },
      workout: workoutWhere,
    };

    const workoutExercises = await this.workoutExerciseRepo.find({
      where,
      relations: ['workout', 'sets'],
      order: { workout: { date: 'ASC' } },
    });

    return workoutExercises.map((we) => toProgressPoint(we));
  }

  async getPersonalRecords(userId: number, exerciseId: number) {
    const sets = await this.exerciseSetRepo.find({
      where: {
        completed: true,
        workoutExercise: {
          exercise: { id: exerciseId },
          workout: { user: { id: userId } },
        },
      },
      relations: [
        'workoutExercise',
        'workoutExercise.workout',
        'workoutExercise.exercise',
      ],
    });

    if (!sets.length) {
      throw new NotFoundException('No completed sets found for this exercise');
    }

    return computePersonalRecords(sets);
  }

  async getAllPersonalRecords(userId: number) {
    const sets = await this.exerciseSetRepo.find({
      where: {
        completed: true,
        workoutExercise: { workout: { user: { id: userId } } },
      },
      relations: [
        'workoutExercise',
        'workoutExercise.workout',
        'workoutExercise.exercise',
      ],
    });
    const byExercise = new Map<number, ExerciseSet[]>();
    for (const set of sets) {
      const exerciseId = set.workoutExercise.exercise.id;
      const group = byExercise.get(exerciseId) ?? [];
      group.push(set);
      byExercise.set(exerciseId, group);
    }

    return Array.from(byExercise.entries()).map(
      ([exerciseId, exerciseSets]) => ({
        exerciseId,
        exerciseName: exerciseSets[0].workoutExercise.exercise.name,
        ...computePersonalRecords(exerciseSets),
      }),
    );
  }

  async getMuscleGroupDistribution(userId: number, from?: string, to?: string) {
    const workoutWhere = this.workoutWhere(userId, from, to);

    const sets = await this.exerciseSetRepo.find({
      where: {
        completed: true,
        workoutExercise: { workout: workoutWhere },
      },
      relations: ['workoutExercise', 'workoutExercise.exercise'],
    });

    const byMuscleGroup = new Map<
      MuscleGroup,
      { sets: number; volume: number }
    >();

    for (const set of sets) {
      const muscleGroup = set.workoutExercise.exercise.muscleGroup;
      const current = byMuscleGroup.get(muscleGroup) ?? {
        sets: 0,
        volume: 0,
      };
      current.sets += 1;
      current.volume += set.weight * set.reps;
      byMuscleGroup.set(muscleGroup, current);
    }

    return Array.from(byMuscleGroup.entries()).map(([muscleGroup, stats]) => ({
      muscleGroup,
      ...stats,
    }));
  }

  // Zwraca gęstą listę dni (bez dziur) w danym zakresie - domyślnie ostatnie
  // 365 dni - gotową pod heatmapę w stylu GitHub contributions.
  // `missed` to liczba treningów z planu pominiętych albo przegapionych
  // (zaplanowanych w przeszłości i nierozpoczętych) danego dnia.
  async getWorkoutFrequency(userId: number, from?: string, to?: string) {
    const rangeTo = to ?? today();
    const rangeFrom = from ?? addDays(rangeTo, -364);

    const [workouts, scheduled] = await Promise.all([
      this.workoutRepo.find({
        where: {
          user: { id: userId },
          date: Between(rangeFrom, rangeTo),
        },
        select: ['date'],
      }),
      this.scheduledRepo.find({
        where: { user: { id: userId }, date: Between(rangeFrom, rangeTo) },
        select: ['date', 'status'],
      }),
    ]);

    const countsByDate = new Map<string, number>();
    for (const workout of workouts) {
      countsByDate.set(
        workout.date,
        (countsByDate.get(workout.date) ?? 0) + 1,
      );
    }

    const now = today();
    const missedByDate = new Map<string, number>();
    for (const s of scheduled) {
      const missed =
        s.status === ScheduledWorkoutStatus.SKIPPED ||
        (s.status === ScheduledWorkoutStatus.PLANNED && s.date < now);
      if (missed) missedByDate.set(s.date, (missedByDate.get(s.date) ?? 0) + 1);
    }

    const days: { date: string; count: number; missed: number }[] = [];
    for (let date = rangeFrom; date <= rangeTo; date = addDays(date, 1)) {
      days.push({
        date,
        count: countsByDate.get(date) ?? 0,
        missed: missedByDate.get(date) ?? 0,
      });
    }

    return days;
  }

  async getCurrentStreak(userId: number): Promise<number> {
    const workouts = await this.workoutRepo.find({
      where: { user: { id: userId } },
      select: ['date'],
    });

    const workoutDates = new Set(workouts.map((w) => w.date));

    let cursor = new Date().toISOString().slice(0, 10);
    if (!workoutDates.has(cursor)) {
      cursor = addDays(cursor, -1);
    }

    let streak = 0;
    while (workoutDates.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }

    return streak;
  }

  async getSummary(userId: number, from?: string, to?: string) {
    const workoutWhere = this.workoutWhere(userId, from, to);

    const [totalWorkouts, muscleGroups, currentStreak] = await Promise.all([
      this.workoutRepo.count({ where: workoutWhere }),
      this.getMuscleGroupDistribution(userId, from, to),
      this.getCurrentStreak(userId),
    ]);

    const totalSets = muscleGroups.reduce((sum, m) => sum + m.sets, 0);
    const totalVolume = muscleGroups.reduce((sum, m) => sum + m.volume, 0);

    const mostTrainedMuscleGroup = muscleGroups.length
      ? muscleGroups.reduce((best, m) => (m.sets > best.sets ? m : best))
          .muscleGroup
      : null;

    return {
      totalWorkouts,
      totalSets,
      totalVolume,
      avgSetsPerWorkout: totalWorkouts ? totalSets / totalWorkouts : 0,
      mostTrainedMuscleGroup,
      currentStreak,
    };
  }

  async getAdherence(userId: number, from?: string, to?: string) {
    const scheduled = await this.scheduledRepo.find({
      where: { user: { id: userId }, date: this.dateRange(from, to) },
      select: ['date', 'status'],
    });
    return computeAdherence(scheduled, today());
  }

  async getWeeklyStats(userId: number, from?: string, to?: string) {
    const rangeTo = to ?? today();
    const [workouts, sets] = await Promise.all([
      this.workoutRepo.find({
        where: this.workoutWhere(userId, from, rangeTo),
        select: ['date'],
      }),
      this.completedSets(userId, from, rangeTo),
    ]);
    return computeWeeklyStats(
      workouts.map((w) => w.date),
      sets,
      rangeTo,
      from,
    );
  }

  async getRepRanges(userId: number, from?: string, to?: string) {
    return computeRepRanges(await this.completedSets(userId, from, to));
  }

  async getStagnation(userId: number) {
    return computeStagnation(await this.completedSets(userId), today());
  }

  async getRepRecords(userId: number, exerciseId: number) {
    return computeRepRecords(
      await this.completedSets(userId, undefined, undefined, exerciseId),
    );
  }

  /** Ukończone serie użytkownika spłaszczone do `SetRow`. */
  private async completedSets(
    userId: number,
    from?: string,
    to?: string,
    exerciseId?: number,
  ): Promise<SetRow[]> {
    const sets = await this.exerciseSetRepo.find({
      where: {
        completed: true,
        workoutExercise: {
          workout: this.workoutWhere(userId, from, to),
          ...(exerciseId ? { exercise: { id: exerciseId } } : {}),
        },
      },
      relations: [
        'workoutExercise',
        'workoutExercise.workout',
        'workoutExercise.exercise',
      ],
    });
    return sets.map((set) => ({
      workoutId: set.workoutExercise.workout.id,
      date: set.workoutExercise.workout.date,
      exerciseId: set.workoutExercise.exercise.id,
      exerciseName: set.workoutExercise.exercise.name,
      weight: set.weight,
      reps: set.reps,
    }));
  }

  private workoutWhere(
    userId: number,
    from?: string,
    to?: string,
  ): FindOptionsWhere<Workout> {
    const where: FindOptionsWhere<Workout> = { user: { id: userId } };
    const date = this.dateRange(from, to);
    if (date) where.date = date;
    return where;
  }

  private dateRange(from?: string, to?: string) {
    if (from && to) return Between(from, to);
    if (from) return MoreThanOrEqual(from);
    if (to) return LessThanOrEqual(to);
    return undefined;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

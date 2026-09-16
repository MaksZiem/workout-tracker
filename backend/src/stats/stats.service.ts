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
import { addDays, computePersonalRecords, toProgressPoint } from './helpers';
import { MuscleGroup } from 'src/enums/muscle-group.enum';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Workout) private workoutRepo: Repository<Workout>,
    @InjectRepository(WorkoutExercise)
    private workoutExerciseRepo: Repository<WorkoutExercise>,
    @InjectRepository(ExerciseSet)
    private exerciseSetRepo: Repository<ExerciseSet>,
    // private workoutService: WorkoutService
  ) {}

  async getExerciseProgress(
    userId: number,
    exerciseId: number,
    from?: string,
    to?: string,
  ) {
    const workoutWhere: FindOptionsWhere<Workout> = { user: { id: userId } };

    if (from && to) {
      workoutWhere.date = Between(from, to);
    } else if (from) {
      workoutWhere.date = MoreThanOrEqual(from);
    } else if (to) {
      workoutWhere.date = LessThanOrEqual(to);
    }

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
    const workoutWhere: FindOptionsWhere<Workout> = { user: { id: userId } };
    if (from && to) {
      workoutWhere.date = Between(from, to);
    } else if (from) {
      workoutWhere.date = MoreThanOrEqual(from);
    } else if (to) {
      workoutWhere.date = LessThanOrEqual(to);
    }

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
  async getWorkoutFrequency(userId: number, from?: string, to?: string) {
    const rangeTo = to ?? new Date().toISOString().slice(0, 10);
    const rangeFrom = from ?? addDays(rangeTo, -364);

    const workouts = await this.workoutRepo.find({
      where: {
        user: { id: userId },
        date: Between(rangeFrom, rangeTo),
      },
      select: ['date'],
    });

    const countsByDate = new Map<string, number>();
    for (const workout of workouts) {
      countsByDate.set(
        workout.date,
        (countsByDate.get(workout.date) ?? 0) + 1,
      );
    }

    const days: { date: string; count: number }[] = [];
    for (let date = rangeFrom; date <= rangeTo; date = addDays(date, 1)) {
      days.push({ date, count: countsByDate.get(date) ?? 0 });
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
    const workoutWhere: FindOptionsWhere<Workout> = { user: { id: userId } };
    if (from && to) {
      workoutWhere.date = Between(from, to);
    } else if (from) {
      workoutWhere.date = MoreThanOrEqual(from);
    } else if (to) {
      workoutWhere.date = LessThanOrEqual(to);
    }

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
}

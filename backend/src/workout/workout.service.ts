import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workout } from './workout.entity';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { FindWorkoutDto } from './dtos/find-workout.dto';
import { assignDefined } from 'src/helpers/assign-defined';
import { UpdateWorkoutDto } from './dtos/update-workout.dto';
import { WorkoutExercise } from './workout-exercise.entity';
import { AddExerciseToWorkoutDto } from './dtos/add-exercise-to-workout.dto';
import { ExerciseService } from 'src/exercise/exercise.service';
import { UpdateWorkoutExerciseDto } from './dtos/update-workout-exercise.dto';
import { AddSetDto } from './dtos/add-set.dto';
import { UpdateSetDto } from './dtos/update-set.dto';
import { ExerciseSet } from './exercise-set.entity';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(Workout) private repo: Repository<Workout>,
    @InjectRepository(WorkoutExercise)
    private workoutExerciseRepo: Repository<WorkoutExercise>,
    @InjectRepository(ExerciseSet)
    private exerciseSetRepo: Repository<ExerciseSet>,
    private exerciseService: ExerciseService,
  ) {}

  create(user: User, dto: CreateWorkoutDto) {
    const workout = this.repo.create({ ...dto, user });
    return this.repo.save(workout);
  }

  findAllForUser(userId: number, filters?: FindWorkoutDto): Promise<Workout[]> {
    const where: FindOptionsWhere<Workout> = { user: { id: userId } };

    if (filters?.from && filters?.to) {
      where.date = Between(filters.from, filters.to);
    } else if (filters?.from) {
      where.date = MoreThanOrEqual(filters.from);
    } else if (filters?.to) {
      where.date = LessThanOrEqual(filters.to);
    }

    return this.repo.find({
      where,
      order: { date: 'desc' },
    });
  }

  findOne(userId: number, id: number) {
    return this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets'],
    });
  }

  async update(userId: number, id: number, dto: UpdateWorkoutDto) {
    const workout = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }
    assignDefined(workout, dto);
    return this.repo.save(workout);
  }

  async remove(userId: number, id: number) {
    const workout = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }
    return this.repo.remove(workout);
  }

  async duplicateWorkout(userId: number, id: number) {
    const workout = await this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets'],
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const duplicate = this.repo.create({
      date: new Date().toISOString().slice(0, 10),
      notes: workout.notes,
      user: workout.user,
      exercises: workout.exercises.map((we) =>
        this.workoutExerciseRepo.create({
          exercise: we.exercise,
          order: we.order,
          sets: we.sets.map((set) =>
            this.exerciseSetRepo.create({
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
              restSeconds: set.restSeconds,
              completed: false,
            }),
          ),
        }),
      ),
    });

    return this.repo.save(duplicate);
  }

  async addExercise(
    userId: number,
    workoutId: number,
    dto: AddExerciseToWorkoutDto,
  ) {
    const workout = await this.repo.findOne({
      where: { id: workoutId, user: { id: userId } },
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const exercise = await this.exerciseService.findOne(dto.exerciseId);
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    const workoutExercise = this.workoutExerciseRepo.create({
      workout,
      exercise,
      order: dto.order,
    });
    return this.workoutExerciseRepo.save(workoutExercise);
  }

  async updateExercise(
    userId: number,
    workoutId: number,
    weId: number,
    dto: UpdateWorkoutExerciseDto,
  ) {
    const we = await this.workoutExerciseRepo.findOne({
      where: { id: weId, workout: { id: workoutId, user: { id: userId } } },
    });
    if (!we) {
      throw new NotFoundException('Workout exercise not found');
    }
    assignDefined(we, dto);
    return this.workoutExerciseRepo.save(we);
  }

  async removeExercise(userId: number, workoutId: number, weId: number) {
    const we = await this.workoutExerciseRepo.findOne({
      where: { id: weId, workout: { id: workoutId, user: { id: userId } } },
    });
    if (!we) {
      throw new NotFoundException('Workout exercise not found');
    }
    return this.workoutExerciseRepo.remove(we);
  }

  async addSet(
    userId: number,
    workoutId: number,
    weId: number,
    dto: AddSetDto,
  ) {
    const we = await this.workoutExerciseRepo.findOne({
      where: { id: weId, workout: { id: workoutId, user: { id: userId } } },
    });
    if (!we) {
      throw new NotFoundException('Workout exercise not found');
    }
    const exerciseSet = this.exerciseSetRepo.create({
      ...dto,
      workoutExercise: we,
    });
    return this.exerciseSetRepo.save(exerciseSet);
  }

  async updateSet(
    userId: number,
    workoutId: number,
    weId: number,
    setId: number,
    dto: UpdateSetDto,
  ) {
    const set = await this.exerciseSetRepo.findOne({
      where: {
        id: setId,
        workoutExercise: { id: weId, workout: { id: workoutId, user: { id: userId } } },
      },
    });
    if (!set) {
      throw new NotFoundException('Set not found');
    }

    assignDefined(set, dto);

    return this.exerciseSetRepo.save(set);
  }

  async removeSet(
    userId: number,
    workoutId: number,
    weId: number,
    setId: number,
  ) {
    const set = await this.exerciseSetRepo.findOne({
      where: {
        id: setId,
        workoutExercise: { id: weId, workout: { id: workoutId, user: { id: userId } } },
      },
    });
    if (!set) {
      throw new NotFoundException('Set not found');
    }
    return this.exerciseSetRepo.remove(set);
  }
}

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

@Injectable()
export class WorkoutService {
  constructor(@InjectRepository(Workout) private repo: Repository<Workout>) {}

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
}

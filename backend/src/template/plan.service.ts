import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { WorkoutPlan } from './workout-plan.entity';
import { CreateWorkoutPlanDto } from './dtos/create-workout-plan.dto';
import { UpdateWorkoutPlanDto } from './dtos/update-workout-plan.dto';
import { assignDefined } from 'src/helpers/assign-defined';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(WorkoutPlan) private repo: Repository<WorkoutPlan>,
  ) {}

  create(user: User, dto: CreateWorkoutPlanDto) {
    const plan = this.repo.create({ ...dto, user });
    return this.repo.save(plan);
  }

  findAllForUser(userId: number) {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(userId: number, id: number) {
    return this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: [
        'templates',
        'templates.exercises',
        'templates.exercises.exercise',
      ],
    });
  }

  async findOwned(userId: number, id: number) {
    const plan = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!plan) {
      throw new NotFoundException('Workout plan not found');
    }
    return plan;
  }

  async update(userId: number, id: number, dto: UpdateWorkoutPlanDto) {
    const plan = await this.findOwned(userId, id);
    assignDefined(plan, dto);
    return this.repo.save(plan);
  }

  async remove(userId: number, id: number) {
    const plan = await this.findOwned(userId, id);
    return this.repo.remove(plan);
  }
}

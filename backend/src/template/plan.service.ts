import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { errorBody } from 'src/common/error-body';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { WorkoutPlan } from './workout-plan.entity';
import { CreateWorkoutPlanDto } from './dtos/create-workout-plan.dto';
import { UpdateWorkoutPlanDto } from './dtos/update-workout-plan.dto';
import { assignDefined } from 'src/helpers/assign-defined';
import { ScheduledWorkout } from 'src/planner/scheduled-workout.entity';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(WorkoutPlan) private repo: Repository<WorkoutPlan>,
  ) {}

  create(user: User, dto: CreateWorkoutPlanDto) {
    const plan = this.repo.create({ ...dto, user });
    return this.repo.save(plan);
  }

  findAllForUser(userId: string) {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(userId: string, id: string) {
    return this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: [
        'templates',
        'templates.exercises',
        'templates.exercises.exercise',
      ],
    });
  }

  async findOwned(userId: string, id: string) {
    const plan = await this.repo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!plan) {
      throw new NotFoundException(
        errorBody(
          HttpStatus.NOT_FOUND,
          'PLAN_NOT_FOUND',
          'Workout plan not found',
        ),
      );
    }
    return plan;
  }

  async update(userId: string, id: string, dto: UpdateWorkoutPlanDto) {
    const plan = await this.findOwned(userId, id);
    assignDefined(plan, dto);
    return this.repo.save(plan);
  }

  async remove(userId: string, id: string) {
    const plan = await this.findOwned(userId, id);
    const today = new Date().toISOString().slice(0, 10);

    return this.repo.manager.transaction(async (manager) => {
      const upcoming = await manager.find(ScheduledWorkout, {
        where: {
          user: { id: userId },
          template: { plan: { id: plan.id } },
          status: ScheduledWorkoutStatus.PLANNED,
          date: MoreThanOrEqual(today),
        },
      });
      await manager.remove(upcoming);
      return manager.remove(plan);
    });
  }
}

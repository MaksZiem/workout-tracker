import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { addDays } from 'src/stats/helpers';
import { TemplateService } from 'src/template/template.service';
import { WorkoutTemplate } from 'src/template/workout-template.entity';
import { WorkoutService } from 'src/workout/workout.service';
import { assignDefined } from 'src/helpers/assign-defined';
import { ScheduledWorkout } from './scheduled-workout.entity';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';
import { CreateScheduledWorkoutDto } from './dtos/create-scheduled-workout.dto';
import { UpdateScheduledWorkoutDto } from './dtos/update-scheduled-workout.dto';
import { FindScheduledWorkoutDto } from './dtos/find-scheduled-workout.dto';
import { GenerateScheduleDto } from './dtos/generate-schedule.dto';

@Injectable()
export class PlannerService {
  constructor(
    @InjectRepository(ScheduledWorkout)
    private repo: Repository<ScheduledWorkout>,
    private templateService: TemplateService,
    private workoutService: WorkoutService,
  ) {}

  async create(user: User, dto: CreateScheduledWorkoutDto) {
    const template = await this.templateService.findOne(
      user.id,
      dto.templateId,
    );
    if (!template) {
      throw new NotFoundException('Workout template not found');
    }
    const scheduled = this.repo.create({ user, template, date: dto.date });
    return this.repo.save(scheduled);
  }

  // Rozkłada wskazane szablony na dni tygodnia w zadanym zakresie dat,
  // np. Push -> poniedziałek, Pull -> środa, Legs -> piątek.
  async generate(user: User, dto: GenerateScheduleDto) {
    const templates = new Map<number, WorkoutTemplate>();
    for (const assignment of dto.assignments) {
      if (!templates.has(assignment.templateId)) {
        const template = await this.templateService.findOne(
          user.id,
          assignment.templateId,
        );
        if (!template) {
          throw new NotFoundException(
            `Workout template ${assignment.templateId} not found`,
          );
        }
        templates.set(assignment.templateId, template);
      }
    }

    const templateIdsByDayOfWeek = new Map<number, number[]>();
    for (const assignment of dto.assignments) {
      const ids = templateIdsByDayOfWeek.get(assignment.dayOfWeek) ?? [];
      ids.push(assignment.templateId);
      templateIdsByDayOfWeek.set(assignment.dayOfWeek, ids);
    }

    const existing = await this.repo.find({
      where: { user: { id: user.id }, date: Between(dto.from, dto.to) },
    });
    const existingDates = new Set(existing.map((s) => s.date));

    const toCreate: ScheduledWorkout[] = [];
    for (let date = dto.from; date <= dto.to; date = addDays(date, 1)) {
      if (existingDates.has(date)) continue;

      const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
      const templateIds = templateIdsByDayOfWeek.get(dayOfWeek) ?? [];
      for (const templateId of templateIds) {
        toCreate.push(
          this.repo.create({
            user,
            template: templates.get(templateId),
            date,
          }),
        );
      }
    }

    return this.repo.save(toCreate);
  }

  findAllForUser(userId: number, filters?: FindScheduledWorkoutDto) {
    const where: FindOptionsWhere<ScheduledWorkout> = {
      user: { id: userId },
    };
    if (filters?.from && filters?.to) {
      where.date = Between(filters.from, filters.to);
    } else if (filters?.from) {
      where.date = MoreThanOrEqual(filters.from);
    } else if (filters?.to) {
      where.date = LessThanOrEqual(filters.to);
    }

    return this.repo.find({
      where,
      relations: ['template'],
      order: { date: 'ASC' },
    });
  }

  findToday(userId: number) {
    const today = new Date().toISOString().slice(0, 10);
    return this.repo.find({
      where: { user: { id: userId }, date: today },
      relations: ['template', 'template.exercises', 'template.exercises.exercise'],
    });
  }

  private async findOwned(userId: number, id: number) {
    const scheduled = await this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: ['template'],
    });
    if (!scheduled) {
      throw new NotFoundException('Scheduled workout not found');
    }
    return scheduled;
  }

  async update(userId: number, id: number, dto: UpdateScheduledWorkoutDto) {
    const scheduled = await this.findOwned(userId, id);
    assignDefined(scheduled, dto);
    return this.repo.save(scheduled);
  }

  async remove(userId: number, id: number) {
    const scheduled = await this.findOwned(userId, id);
    return this.repo.remove(scheduled);
  }

  // Tworzy realny Workout z serii wypełnionymi wartościami docelowymi z szablonu.
  async start(userId: number, id: number) {
    const scheduled = await this.findOwned(userId, id);
    if (!scheduled.template) {
      throw new NotFoundException(
        'Scheduled workout has no template to start from',
      );
    }

    const template = await this.templateService.findOne(
      userId,
      scheduled.template.id,
    );
    if (!template) {
      throw new NotFoundException('Workout template not found');
    }

    const workout = await this.workoutService.createFromTemplate(
      { id: userId } as User,
      template,
      scheduled.date,
    );

    scheduled.workout = workout;
    scheduled.status = ScheduledWorkoutStatus.COMPLETED;
    return this.repo.save(scheduled);
  }
}

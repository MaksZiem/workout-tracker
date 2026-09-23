import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { WorkoutTemplate } from './workout-template.entity';
import { WorkoutTemplateExercise } from './workout-template-exercise.entity';
import { CreateWorkoutTemplateDto } from './dtos/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from './dtos/update-workout-template.dto';
import { AddTemplateExerciseDto } from './dtos/add-template-exercise.dto';
import { UpdateTemplateExerciseDto } from './dtos/update-template-exercise.dto';
import { assignDefined } from 'src/helpers/assign-defined';
import { ExerciseService } from 'src/exercise/exercise.service';
import { PlanService } from './plan.service';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(WorkoutTemplate)
    private repo: Repository<WorkoutTemplate>,
    @InjectRepository(WorkoutTemplateExercise)
    private templateExerciseRepo: Repository<WorkoutTemplateExercise>,
    private exerciseService: ExerciseService,
    private planService: PlanService,
  ) {}

  async create(user: User, dto: CreateWorkoutTemplateDto) {
    const plan = dto.planId
      ? await this.planService.findOwned(user.id, dto.planId)
      : null;

    const template = this.repo.create({
      name: dto.name,
      notes: dto.notes,
      user,
      plan,
    });
    return this.repo.save(template);
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
      relations: ['exercises', 'exercises.exercise'],
    });
  }

  private async findOwned(userId: number, id: number) {
    const template = await this.findOne(userId, id);
    if (!template) {
      throw new NotFoundException('Workout template not found');
    }
    return template;
  }

  async update(userId: number, id: number, dto: UpdateWorkoutTemplateDto) {
    const template = await this.findOwned(userId, id);
    assignDefined(template, dto);
    return this.repo.save(template);
  }

  async remove(userId: number, id: number) {
    const template = await this.findOwned(userId, id);
    return this.repo.remove(template);
  }

  async addExercise(
    userId: number,
    templateId: number,
    dto: AddTemplateExerciseDto,
  ) {
    const template = await this.findOwned(userId, templateId);

    const exercise = await this.exerciseService.findOne(dto.exerciseId);
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    const templateExercise = this.templateExerciseRepo.create({
      template,
      exercise,
      order: dto.order,
      targetSets: dto.targetSets,
      targetReps: dto.targetReps,
      targetWeight: dto.targetWeight,
      restSeconds: dto.restSeconds,
    });
    return this.templateExerciseRepo.save(templateExercise);
  }

  async updateExercise(
    userId: number,
    templateId: number,
    teId: number,
    dto: UpdateTemplateExerciseDto,
  ) {
    const te = await this.templateExerciseRepo.findOne({
      where: { id: teId, template: { id: templateId, user: { id: userId } } },
    });
    if (!te) {
      throw new NotFoundException('Template exercise not found');
    }
    assignDefined(te, dto);
    return this.templateExerciseRepo.save(te);
  }

  async removeExercise(userId: number, templateId: number, teId: number) {
    const te = await this.templateExerciseRepo.findOne({
      where: { id: teId, template: { id: templateId, user: { id: userId } } },
    });
    if (!te) {
      throw new NotFoundException('Template exercise not found');
    }
    return this.templateExerciseRepo.remove(te);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { WorkoutTemplate } from './workout-template.entity';
import { WorkoutTemplateExercise } from './workout-template-exercise.entity';
import { WorkoutPlan } from './workout-plan.entity';
import { ExerciseModule } from 'src/exercise/exercise.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutTemplate,
      WorkoutTemplateExercise,
      WorkoutPlan,
    ]),
    ExerciseModule,
    UsersModule,
  ],
  controllers: [TemplateController, PlanController],
  providers: [TemplateService, PlanService],
  exports: [TemplateService, PlanService],
})
export class TemplateModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { WorkoutTemplate } from './workout-template.entity';
import { WorkoutTemplateExercise } from './workout-template-exercise.entity';
import { ExerciseModule } from 'src/exercise/exercise.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutTemplate, WorkoutTemplateExercise]),
    ExerciseModule,
    UsersModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}

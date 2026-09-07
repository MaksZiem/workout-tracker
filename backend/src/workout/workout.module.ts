import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { Workout } from './workout.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { ExerciseSet } from './exercise-set.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workout, WorkoutExercise, ExerciseSet])],
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}

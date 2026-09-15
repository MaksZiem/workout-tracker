import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { Workout } from './workout.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { ExerciseSet } from './exercise-set.entity';
import { ExerciseModule } from 'src/exercise/exercise.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workout, WorkoutExercise, ExerciseSet]),
    ExerciseModule,
    UsersModule,
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}

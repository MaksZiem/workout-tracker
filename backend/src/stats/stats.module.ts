import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from 'src/workout/workout.entity';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';
import { ExerciseSet } from 'src/workout/exercise-set.entity';
import { ExerciseModule } from 'src/exercise/exercise.module';
import { WorkoutModule } from 'src/workout/workout.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workout, WorkoutExercise, ExerciseSet]),
    ExerciseModule,
    WorkoutModule
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

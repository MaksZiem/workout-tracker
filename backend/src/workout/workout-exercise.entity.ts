import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exercise } from 'src/exercise/exercise.entity';
import { Workout } from './workout.entity';
import { ExerciseSet } from './exercise-set.entity';

@Entity()
export class WorkoutExercise {
  @ApiProperty({ description: 'Unikalny identyfikator wpisu ćwiczenia w treningu', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workout, (workout) => workout.exercises, {
    onDelete: 'CASCADE',
  })
  workout: Workout;

  @ApiProperty({ description: 'Ćwiczenie z globalnego katalogu', type: () => Exercise })
  @ManyToOne(() => Exercise, (exercise) => exercise.workoutExercises)
  exercise: Exercise;

  @ApiProperty({ description: 'Kolejność ćwiczenia w treningu (0 = pierwsze)', example: 0 })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ description: 'Serie wykonane w ramach tego ćwiczenia', type: () => ExerciseSet, isArray: true })
  @OneToMany(() => ExerciseSet, (set) => set.workoutExercise, {
    cascade: true,
  })
  sets: ExerciseSet[];
}

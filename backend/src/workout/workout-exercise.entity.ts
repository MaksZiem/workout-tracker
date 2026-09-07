import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exercise } from 'src/exercise/exercise.entity';
import { Workout } from './workout.entity';
import { ExerciseSet } from './exercise-set.entity';

@Entity()
export class WorkoutExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workout, (workout) => workout.exercises, {
    onDelete: 'CASCADE',
  })
  workout: Workout;

  @ManyToOne(() => Exercise, (exercise) => exercise.workoutExercises)
  exercise: Exercise;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => ExerciseSet, (set) => set.workoutExercise, {
    cascade: true,
  })
  sets: ExerciseSet[];
}

import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity()
export class ExerciseSet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkoutExercise, (workoutExercise) => workoutExercise.sets, {
    onDelete: 'CASCADE',
  })
  workoutExercise: WorkoutExercise;

  @Column({ default: 1 })
  setNumber: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value === null ? null : parseFloat(value)),
    },
  })
  weight: number;

  @Column()
  reps: number;

  @Column({ nullable: true })
  restSeconds: number;

  @Column({ default: false })
  completed: boolean;
}

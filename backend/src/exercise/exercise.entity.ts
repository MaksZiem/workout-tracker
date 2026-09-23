import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';

@Entity()
export class Exercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: MuscleGroup, nullable: true })
  muscleGroup: MuscleGroup;

  @Column('float8', { array: true, nullable: true })
  embedding: number[] | null;

  @OneToMany(() => WorkoutExercise, (we) => we.exercise)
  workoutExercises: WorkoutExercise[];
}

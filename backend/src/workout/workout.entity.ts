import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity()
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => WorkoutExercise, (we) => we.workout, { cascade: true })
  exercises: WorkoutExercise[];

  @CreateDateColumn()
  createdAt: Date;
}

import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutTemplateExercise } from './workout-template-exercise.entity';

@Entity()
export class WorkoutTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => WorkoutTemplateExercise, (te) => te.template, {
    cascade: true,
  })
  exercises: WorkoutTemplateExercise[];

  @CreateDateColumn()
  createdAt: Date;
}

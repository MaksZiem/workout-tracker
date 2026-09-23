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
import { WorkoutPlan } from './workout-plan.entity';

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

  @ManyToOne(() => WorkoutPlan, (plan) => plan.templates, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  plan: WorkoutPlan | null;

  @OneToMany(() => WorkoutTemplateExercise, (te) => te.template, {
    cascade: true,
  })
  exercises: WorkoutTemplateExercise[];

  @CreateDateColumn()
  createdAt: Date;
}

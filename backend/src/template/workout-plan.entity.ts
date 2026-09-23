import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutTemplate } from './workout-template.entity';

@Entity()
export class WorkoutPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => WorkoutTemplate, (template) => template.plan)
  templates: WorkoutTemplate[];

  @CreateDateColumn()
  createdAt: Date;
}

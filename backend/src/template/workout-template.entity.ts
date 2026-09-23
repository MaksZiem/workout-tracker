import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkoutTemplateExercise } from './workout-template-exercise.entity';
import { WorkoutPlan } from './workout-plan.entity';

@Entity()
export class WorkoutTemplate {
  @ApiProperty({ description: 'Unikalny identyfikator szablonu', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ description: 'Nazwa szablonu treningowego', example: 'Push Day A' })
  @Column()
  name: string;

  @ApiPropertyOptional({ description: 'Notatki do szablonu', example: 'Skupienie na klatce piersiowej i barkach' })
  @Column({ nullable: true })
  notes: string;

  @ApiPropertyOptional({ description: 'Plan treningowy, do którego należy szablon (opcjonalny)', type: () => WorkoutPlan, nullable: true })
  @ManyToOne(() => WorkoutPlan, (plan) => plan.templates, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  plan: WorkoutPlan | null;

  @ApiPropertyOptional({ description: 'Lista ćwiczeń wchodzących w skład szablonu', type: () => WorkoutTemplateExercise, isArray: true })
  @OneToMany(() => WorkoutTemplateExercise, (te) => te.template, {
    cascade: true,
  })
  exercises: WorkoutTemplateExercise[];

  @ApiProperty({ description: 'Data utworzenia szablonu', example: '2026-09-20T10:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}

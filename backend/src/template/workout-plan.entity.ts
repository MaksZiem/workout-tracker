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
import { WorkoutTemplate } from './workout-template.entity';

@Entity()
export class WorkoutPlan {
  @ApiProperty({ description: 'Unikalny identyfikator planu', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ description: 'Nazwa planu treningowego', example: 'Plan siłowy 3x/tydzień' })
  @Column()
  name: string;

  @ApiPropertyOptional({ description: 'Notatki do planu', example: 'Cel: przyrost siły w 12 tygodni' })
  @Column({ nullable: true })
  notes: string;

  @ApiPropertyOptional({ description: 'Szablony treningowe należące do tego planu', type: () => WorkoutTemplate, isArray: true })
  @OneToMany(() => WorkoutTemplate, (template) => template.plan)
  templates: WorkoutTemplate[];

  @ApiProperty({ description: 'Data utworzenia planu', example: '2026-09-15T09:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}

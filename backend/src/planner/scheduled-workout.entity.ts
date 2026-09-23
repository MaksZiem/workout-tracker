import { User } from 'src/users/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkoutTemplate } from 'src/template/workout-template.entity';
import { Workout } from 'src/workout/workout.entity';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';

@Entity()
export class ScheduledWorkout {
  @ApiProperty({ description: 'Unikalny identyfikator zaplanowanego treningu', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiPropertyOptional({ description: 'Szablon treningowy, na podstawie którego trening zostanie wygenerowany', type: () => WorkoutTemplate, nullable: true })
  @ManyToOne(() => WorkoutTemplate, { onDelete: 'SET NULL', nullable: true })
  template: WorkoutTemplate;

  @ApiProperty({ description: 'Zaplanowana data treningu (YYYY-MM-DD)', example: '2026-09-25' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({
    description: 'Status zaplanowanego treningu',
    enum: ScheduledWorkoutStatus,
    example: ScheduledWorkoutStatus.PLANNED,
    default: ScheduledWorkoutStatus.PLANNED,
  })
  @Column({
    type: 'enum',
    enum: ScheduledWorkoutStatus,
    default: ScheduledWorkoutStatus.PLANNED,
  })
  status: ScheduledWorkoutStatus;

  @ApiPropertyOptional({
    description: 'Faktyczny trening utworzony po rozpoczęciu zaplanowanej sesji (patrz POST /planner/scheduled/{id}/start)',
    type: () => Workout,
    nullable: true,
  })
  @ManyToOne(() => Workout, { onDelete: 'SET NULL', nullable: true })
  workout: Workout;
}

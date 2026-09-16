import { User } from 'src/users/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { WorkoutTemplate } from 'src/template/workout-template.entity';
import { Workout } from 'src/workout/workout.entity';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';

@Entity()
export class ScheduledWorkout {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => WorkoutTemplate, { onDelete: 'SET NULL', nullable: true })
  template: WorkoutTemplate;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: ScheduledWorkoutStatus,
    default: ScheduledWorkoutStatus.PLANNED,
  })
  status: ScheduledWorkoutStatus;

  @ManyToOne(() => Workout, { onDelete: 'SET NULL', nullable: true })
  workout: Workout;
}

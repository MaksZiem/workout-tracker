import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exercise } from 'src/exercise/exercise.entity';
import { WorkoutTemplate } from './workout-template.entity';

@Entity()
export class WorkoutTemplateExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkoutTemplate, (template) => template.exercises, {
    onDelete: 'CASCADE',
  })
  template: WorkoutTemplate;

  @ManyToOne(() => Exercise)
  exercise: Exercise;

  @Column({ default: 0 })
  order: number;

  @Column({ default: 3 })
  targetSets: number;

  @Column()
  targetReps: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value === null ? null : parseFloat(value)),
    },
  })
  targetWeight: number;

  @Column({ nullable: true })
  restSeconds: number;
}

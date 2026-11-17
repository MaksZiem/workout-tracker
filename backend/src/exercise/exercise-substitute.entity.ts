import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Exercise } from './exercise.entity';

@Entity()
@Unique(['exercise', 'substitute'])
export class ExerciseSubstitute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE' })
  exercise: Exercise;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE', eager: true })
  substitute: Exercise;

  @Column()
  reason: string;

  @Column({ default: 0 })
  rank: number;
}

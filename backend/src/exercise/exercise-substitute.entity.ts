import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Exercise } from './exercise.entity';

/** Zamiennik dobrany przez AI dla ćwiczenia, z krótkim uzasadnieniem. Kierunkowy: A → B nie oznacza B → A. */
@Entity()
@Unique(['exercise', 'substitute'])
export class ExerciseSubstitute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE' })
  exercise: Exercise;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE', eager: true })
  substitute: Exercise;

  /** Co łączy oba ćwiczenia, jednym zdaniem (od AI). */
  @Column()
  reason: string;

  /** Kolejność od najlepszego zamiennika (0 = najlepszy). */
  @Column({ default: 0 })
  rank: number;
}

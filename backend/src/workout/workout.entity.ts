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
import { WorkoutExercise } from './workout-exercise.entity';

@Entity()
export class Workout {
  @ApiProperty({ description: 'Unikalny identyfikator treningu', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ description: 'Data odbycia treningu (YYYY-MM-DD)', example: '2026-09-22' })
  @Column({ type: 'date' })
  date: string;

  @ApiPropertyOptional({ description: 'Notatki dotyczące treningu', example: 'Świetna sesja, nowy rekord na przysiadzie' })
  @Column({ nullable: true })
  notes: string;

  @ApiPropertyOptional({
    description: 'Ćwiczenia wykonane w ramach treningu wraz z seriami (zwracane przy pobieraniu pojedynczego treningu)',
    type: () => WorkoutExercise,
    isArray: true,
  })
  @OneToMany(() => WorkoutExercise, (we) => we.workout, { cascade: true })
  exercises: WorkoutExercise[];

  @ApiProperty({ description: 'Data utworzenia rekordu w systemie', example: '2026-09-22T18:32:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}

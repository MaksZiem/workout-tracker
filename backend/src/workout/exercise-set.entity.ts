import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity()
export class ExerciseSet {
  @ApiProperty({ description: 'Unikalny identyfikator serii', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkoutExercise, (workoutExercise) => workoutExercise.sets, {
    onDelete: 'CASCADE',
  })
  workoutExercise: WorkoutExercise;

  @ApiProperty({ description: 'Numer serii w ramach ćwiczenia (od 1)', example: 1 })
  @Column({ default: 1 })
  setNumber: number;

  @ApiProperty({ description: 'Użyty ciężar w kilogramach', example: 80 })
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value === null ? null : parseFloat(value)),
    },
  })
  weight: number;

  @ApiProperty({ description: 'Liczba wykonanych powtórzeń', example: 8 })
  @Column()
  reps: number;

  @ApiPropertyOptional({ description: 'Czas odpoczynku po serii w sekundach', example: 90 })
  @Column({ nullable: true })
  restSeconds: number;

  @ApiProperty({ description: 'Czy seria została ukończona', example: true, default: false })
  @Column({ default: false })
  completed: boolean;
}

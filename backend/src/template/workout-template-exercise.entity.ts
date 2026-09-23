import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exercise } from 'src/exercise/exercise.entity';
import { WorkoutTemplate } from './workout-template.entity';

@Entity()
export class WorkoutTemplateExercise {
  @ApiProperty({ description: 'Unikalny identyfikator wpisu ćwiczenia w szablonie', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkoutTemplate, (template) => template.exercises, {
    onDelete: 'CASCADE',
  })
  template: WorkoutTemplate;

  @ApiProperty({ description: 'Ćwiczenie z globalnego katalogu', type: () => Exercise })
  @ManyToOne(() => Exercise)
  exercise: Exercise;

  @ApiProperty({ description: 'Kolejność ćwiczenia w szablonie (0 = pierwsze)', example: 0 })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ description: 'Docelowa liczba serii', example: 4, default: 3 })
  @Column({ default: 3 })
  targetSets: number;

  @ApiProperty({ description: 'Docelowa liczba powtórzeń w serii', example: 10 })
  @Column()
  targetReps: number;

  @ApiPropertyOptional({ description: 'Docelowy ciężar w kilogramach', example: 60 })
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

  @ApiPropertyOptional({ description: 'Docelowy czas odpoczynku w sekundach', example: 90 })
  @Column({ nullable: true })
  restSeconds: number;
}

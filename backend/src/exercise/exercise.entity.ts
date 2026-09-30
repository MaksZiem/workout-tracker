import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { WorkoutExercise } from 'src/workout/workout-exercise.entity';

@Entity()
export class Exercise {
  @ApiProperty({ description: 'Unikalny identyfikator ćwiczenia', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nazwa ćwiczenia (unikalna)', example: 'Wyciskanie sztangi leżąc' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'Główna grupa mięśniowa angażowana przez ćwiczenie',
    enum: MuscleGroup,
    example: MuscleGroup.CHEST,
  })
  @Column({ type: 'enum', enum: MuscleGroup, nullable: true })
  muscleGroup: MuscleGroup;

  @ApiProperty({
    description:
      'Kiedy AI ostatnio dobrało zamienniki tego ćwiczenia; null, gdy jeszcze nie dobierało (np. Gemini nie odpowiedział przy zapisie)',
    example: '2026-09-30T12:00:00.000Z',
    nullable: true,
    type: String,
  })
  @Column({ type: 'timestamptz', nullable: true })
  substitutesGeneratedAt: Date | null;

  @OneToMany(() => WorkoutExercise, (we) => we.exercise)
  workoutExercises: WorkoutExercise[];
}

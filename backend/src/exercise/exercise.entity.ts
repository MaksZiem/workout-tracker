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
      'Wektor embeddingu semantycznego (generowany automatycznie przez Gemini) używany do wyszukiwania podobnych ćwiczeń. Pole wewnętrzne - nie jest wypełniane ręcznie.',
    type: [Number],
    example: [0.0123, -0.0456, 0.0789],
    nullable: true,
  })
  @Column('float8', { array: true, nullable: true })
  embedding: number[] | null;

  @OneToMany(() => WorkoutExercise, (we) => we.exercise)
  workoutExercises: WorkoutExercise[];
}

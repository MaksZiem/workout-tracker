import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
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

  // Wektor embeddingu semantycznego (Gemini) do wyszukiwania podobnych ćwiczeń.
  // Pole wewnętrzne: nie trafia do odpowiedzi API (kilkaset liczb na ćwiczenie).
  @Exclude()
  @Column('float8', { array: true, nullable: true })
  embedding: number[] | null;

  @ApiProperty({
    description: 'Czy ćwiczenie ma już embedding (bez niego nie działa wyszukiwanie podobnych ćwiczeń)',
    example: true,
  })
  @Expose()
  get hasEmbedding(): boolean {
    return Array.isArray(this.embedding) && this.embedding.length > 0;
  }

  @OneToMany(() => WorkoutExercise, (we) => we.exercise)
  workoutExercises: WorkoutExercise[];
}

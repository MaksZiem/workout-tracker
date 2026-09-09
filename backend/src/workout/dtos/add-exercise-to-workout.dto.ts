import { IsInt, IsOptional, Min } from 'class-validator';

export class AddExerciseToWorkoutDto {
  @IsInt()
  exerciseId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

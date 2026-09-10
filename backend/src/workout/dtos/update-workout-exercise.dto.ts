import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateWorkoutExerciseDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class AddTemplateExerciseDto {
  @IsInt()
  exerciseId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsInt()
  @Min(1)
  targetSets: number;

  @IsInt()
  @Min(1)
  targetReps: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  targetWeight?: number;

  @IsOptional()
  @IsInt()
  restSeconds?: number;
}

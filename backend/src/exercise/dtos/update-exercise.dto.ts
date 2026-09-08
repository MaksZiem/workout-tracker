import { IsEnum, IsOptional, IsString } from "class-validator";
import { MuscleGroup } from "src/enums/muscle-group.enum";

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup
}
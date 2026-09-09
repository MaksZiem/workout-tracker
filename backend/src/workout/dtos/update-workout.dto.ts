import { IsDateString, IsOptional, IsString } from "class-validator";

export class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsDateString()
  date?: string
}
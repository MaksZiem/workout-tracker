import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkoutPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

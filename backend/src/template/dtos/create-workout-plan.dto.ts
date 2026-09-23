import { IsOptional, IsString } from 'class-validator';

export class CreateWorkoutPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

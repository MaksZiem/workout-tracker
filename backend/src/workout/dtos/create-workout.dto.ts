import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateWorkoutDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

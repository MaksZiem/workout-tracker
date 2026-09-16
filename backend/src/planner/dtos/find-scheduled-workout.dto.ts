import { IsDateString, IsOptional } from 'class-validator';

export class FindScheduledWorkoutDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

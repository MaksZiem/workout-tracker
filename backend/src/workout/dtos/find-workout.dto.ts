import { IsDateString, IsOptional } from 'class-validator';

export class FindWorkoutDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

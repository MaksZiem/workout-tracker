import { IsDateString, IsOptional } from 'class-validator';

export class ExerciseProgressFilterDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

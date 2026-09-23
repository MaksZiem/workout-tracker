import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class FindWorkoutDto {
  @ApiPropertyOptional({ description: 'Data początkowa zakresu (włącznie, YYYY-MM-DD)', example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Data końcowa zakresu (włącznie, YYYY-MM-DD)', example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

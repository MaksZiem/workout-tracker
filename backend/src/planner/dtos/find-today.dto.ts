import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class FindTodayDto {
  @ApiPropertyOptional({
    description: 'Dzisiejsza data w strefie użytkownika (YYYY-MM-DD). Domyślnie bieżący dzień w UTC.',
    example: '2026-09-24',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateWorkoutDto {
  @ApiProperty({ description: 'Data odbycia treningu (format ISO 8601, YYYY-MM-DD)', example: '2026-09-22' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Notatki dotyczące treningu', example: 'Dzień push - klatka, barki, triceps' })
  @IsOptional()
  @IsString()
  notes?: string;
}

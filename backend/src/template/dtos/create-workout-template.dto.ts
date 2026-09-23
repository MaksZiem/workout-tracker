import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateWorkoutTemplateDto {
  @ApiProperty({ description: 'Nazwa szablonu treningowego', example: 'Push Day A' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Notatki do szablonu', example: 'Skupienie na klatce piersiowej i barkach' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Identyfikator planu, do którego ma należeć szablon', example: 1 })
  @IsOptional()
  @IsInt()
  planId?: number;
}

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateWorkoutPlanDto {
  @ApiProperty({ description: 'Nazwa planu treningowego', example: 'Plan siłowy 3x/tydzień' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Notatki do planu', example: 'Cel: przyrost siły w 12 tygodni' })
  @IsOptional()
  @IsString()
  notes?: string;
}

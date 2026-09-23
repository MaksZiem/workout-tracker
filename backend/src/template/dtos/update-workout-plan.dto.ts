import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkoutPlanDto {
  @ApiPropertyOptional({ description: 'Nowa nazwa planu', example: 'Plan siłowy - faza 2' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Nowe notatki', example: 'Zwiększona intensywność' })
  @IsOptional()
  @IsString()
  notes?: string;
}

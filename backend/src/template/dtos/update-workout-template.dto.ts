import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkoutTemplateDto {
  @ApiPropertyOptional({ description: 'Nowa nazwa szablonu', example: 'Push Day B' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Nowe notatki', example: 'Zwiększony ciężar na wyciskaniu' })
  @IsOptional()
  @IsString()
  notes?: string;
}

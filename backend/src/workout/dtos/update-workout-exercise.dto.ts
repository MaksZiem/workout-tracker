import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateWorkoutExerciseDto {
  @ApiPropertyOptional({ description: 'Nowa kolejność ćwiczenia w treningu', example: 1, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

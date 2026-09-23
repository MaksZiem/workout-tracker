import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AddExerciseToWorkoutDto {
  @ApiProperty({ description: 'Identyfikator ćwiczenia z globalnego katalogu (GET /exercise)', example: 1 })
  @IsInt()
  exerciseId: number;

  @ApiPropertyOptional({ description: 'Kolejność ćwiczenia w treningu (0 = pierwsze)', example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

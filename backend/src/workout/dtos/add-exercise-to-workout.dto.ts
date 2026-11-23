import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddExerciseToWorkoutDto {
  @ApiProperty({
    description:
      'Identyfikator ćwiczenia z globalnego katalogu (GET /exercise)',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @IsUUID()
  exerciseId: string;

  @ApiPropertyOptional({
    description: 'Kolejność ćwiczenia w treningu (0 = pierwsze)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

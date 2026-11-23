import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddTemplateExerciseDto {
  @ApiProperty({
    description:
      'Identyfikator ćwiczenia z globalnego katalogu (GET /exercise)',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @IsUUID()
  exerciseId: string;

  @ApiPropertyOptional({
    description: 'Kolejność ćwiczenia w szablonie (0 = pierwsze)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: 'Docelowa liczba serii', example: 4, minimum: 1 })
  @IsInt()
  @Min(1)
  targetSets: number;

  @ApiProperty({
    description: 'Docelowa liczba powtórzeń w serii',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  targetReps: number;

  @ApiPropertyOptional({
    description: 'Docelowy ciężar w kilogramach',
    example: 60,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  targetWeight?: number;

  @ApiPropertyOptional({
    description: 'Docelowy czas odpoczynku w sekundach',
    example: 90,
  })
  @IsOptional()
  @IsInt()
  restSeconds?: number;
}

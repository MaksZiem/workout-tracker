import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateTemplateExerciseDto {
  @ApiPropertyOptional({
    description:
      'Zamiana ćwiczenia na inne z katalogu (np. podobne); cele i kolejność zostają',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @IsOptional()
  @IsUUID()
  exerciseId?: string;

  @ApiPropertyOptional({
    description: 'Nowa kolejność ćwiczenia w szablonie',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    description: 'Nowa docelowa liczba serii',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetSets?: number;

  @ApiPropertyOptional({
    description: 'Nowa docelowa liczba powtórzeń',
    example: 8,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetReps?: number;

  @ApiPropertyOptional({
    description: 'Nowy docelowy ciężar w kilogramach',
    example: 65,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  targetWeight?: number;

  @ApiPropertyOptional({
    description: 'Nowy docelowy czas odpoczynku w sekundach',
    example: 120,
  })
  @IsOptional()
  @IsInt()
  restSeconds?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { Exercise } from '../exercise.entity';

export class ExerciseSubstituteDto {
  @ApiProperty({ description: 'Ćwiczenie-zamiennik z katalogu', type: () => Exercise })
  exercise: Exercise;

  @ApiProperty({ description: 'Uzasadnienie od AI: co łączy oba ćwiczenia', example: 'Ten sam ruch pionowego przyciągania, praca najszerszych grzbietu.' })
  reason: string;
}

export class GenerateAllSubstitutesResultDto {
  @ApiProperty({ description: 'Liczba ćwiczeń, dla których dobrano zamienniki', example: 22 })
  updated: number;

  @ApiProperty({ description: 'Nazwy ćwiczeń, dla których AI nie odpowiedziało', type: [String], example: [] })
  failed: string[];
}

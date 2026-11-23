import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ParseWorkoutDto {
  @ApiProperty({
    description:
      'Identyfikator istniejącego treningu, do którego zostaną dopisane rozpoznane ćwiczenia i serie',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @IsUUID()
  workoutId: string;

  @ApiProperty({
    description:
      'Swobodny opis wykonanego treningu w języku naturalnym - AI rozpozna ćwiczenia, powtórzenia i ciężary.',
    example:
      'Wyciskanie sztangi leżąc 3 serie po 8 powtórzeń z 80kg, potem rozpiętki 3x12 z 14kg',
  })
  @IsString()
  text: string;
}

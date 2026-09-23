import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class ParseWorkoutDto {
  @ApiProperty({ description: 'Identyfikator istniejącego treningu, do którego zostaną dopisane rozpoznane ćwiczenia i serie', example: 1 })
  @IsInt()
  workoutId: number;

  @ApiProperty({
    description: 'Swobodny opis wykonanego treningu w języku naturalnym - AI rozpozna ćwiczenia, powtórzenia i ciężary.',
    example: 'Wyciskanie sztangi leżąc 3 serie po 8 powtórzeń z 80kg, potem rozpiętki 3x12 z 14kg',
  })
  @IsString()
  text: string;
}

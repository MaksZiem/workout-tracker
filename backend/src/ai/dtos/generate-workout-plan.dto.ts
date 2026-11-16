import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TrainingGoal } from 'src/enums/training-goal.enum';

export const PLAN_LANGUAGES = ['pl', 'en'] as const;
export type PlanLanguage = (typeof PLAN_LANGUAGES)[number];

export class GenerateWorkoutPlanDto {
  @ApiProperty({ description: 'Cel treningowy', enum: TrainingGoal, example: TrainingGoal.HYPERTROPHY })
  @IsEnum(TrainingGoal)
  goal: TrainingGoal;

  @ApiProperty({ description: 'Liczba dni treningowych w tygodniu', example: 4, minimum: 1, maximum: 7 })
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek: number;

  @ApiPropertyOptional({
    description: 'Dodatkowe ograniczenia lub preferencje uwzględniane przez AI przy układaniu planu',
    example: 'Kontuzja barku - unikać wyciskania nad głowę, brak dostępu do sztangi',
  })
  @IsOptional()
  @IsString()
  constraints?: string;

  @ApiPropertyOptional({
    description: 'Język nazw i notatek w wygenerowanym planie (domyślnie pl)',
    enum: PLAN_LANGUAGES,
    example: 'pl',
  })
  @IsOptional()
  @IsIn(PLAN_LANGUAGES)
  language?: PlanLanguage;
}

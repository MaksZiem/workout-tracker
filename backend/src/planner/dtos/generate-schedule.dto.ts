import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ScheduleAssignmentDto {
  @ApiProperty({ description: 'Identyfikator szablonu treningowego przypisanego do danego dnia tygodnia', example: 1 })
  @IsInt()
  templateId: number;

  @ApiProperty({
    description: 'Dzień tygodnia (0 = niedziela ... 6 = sobota, zgodnie z JS Date#getUTCDay())',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  // 0 = Sunday ... 6 = Saturday, matches JS Date#getUTCDay()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;
}

export class GenerateScheduleDto {
  @ApiProperty({ description: 'Data początkowa generowanego harmonogramu (YYYY-MM-DD)', example: '2026-09-29' })
  @IsDateString()
  from: string;

  @ApiProperty({ description: 'Data końcowa generowanego harmonogramu (YYYY-MM-DD, włącznie)', example: '2026-10-26' })
  @IsDateString()
  to: string;

  @ApiProperty({
    description: 'Przypisania szablonów do dni tygodnia. Dla każdego dnia w zakresie [from, to], którego dzień tygodnia pasuje do wpisu, zostanie utworzony zaplanowany trening.',
    type: () => ScheduleAssignmentDto,
    isArray: true,
    example: [
      { templateId: 1, dayOfWeek: 1 },
      { templateId: 2, dayOfWeek: 3 },
      { templateId: 3, dayOfWeek: 5 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleAssignmentDto)
  assignments: ScheduleAssignmentDto[];
}

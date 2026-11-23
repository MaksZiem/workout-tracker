import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ScheduleAssignmentDto {
  @ApiProperty({
    description:
      'Identyfikator szablonu treningowego przypisanego do danego dnia tygodnia',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description:
      'Dzień tygodnia (0 = niedziela ... 6 = sobota, zgodnie z JS Date#getUTCDay())',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;
}

export class GenerateScheduleDto {
  @ApiProperty({
    description: 'Data początkowa generowanego harmonogramu (YYYY-MM-DD)',
    example: '2026-09-29',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description:
      'Data końcowa generowanego harmonogramu (YYYY-MM-DD, włącznie)',
    example: '2026-10-26',
  })
  @IsDateString()
  to: string;

  @ApiProperty({
    description:
      'Przypisania szablonów do dni tygodnia. Dla każdego dnia w zakresie [from, to], którego dzień tygodnia pasuje do wpisu, zostanie utworzony zaplanowany trening.',
    type: () => ScheduleAssignmentDto,
    isArray: true,
    example: [
      { templateId: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c', dayOfWeek: 1 },
      { templateId: '8a1d4f6b-2c3e-4b5a-9d7e-1f2a3b4c5d6e', dayOfWeek: 3 },
      { templateId: 'c7e9a2b4-5d6f-4a1b-8c3d-9e0f1a2b3c4d', dayOfWeek: 5 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleAssignmentDto)
  assignments: ScheduleAssignmentDto[];
}

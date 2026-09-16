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
  @IsInt()
  templateId: number;

  // 0 = Sunday ... 6 = Saturday, matches JS Date#getUTCDay()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;
}

export class GenerateScheduleDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleAssignmentDto)
  assignments: ScheduleAssignmentDto[];
}

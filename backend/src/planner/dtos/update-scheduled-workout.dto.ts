import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';

export class UpdateScheduledWorkoutDto {
  @ApiPropertyOptional({ description: 'Nowa data zaplanowanego treningu (YYYY-MM-DD)', example: '2026-09-26' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Nowy status', enum: ScheduledWorkoutStatus, example: ScheduledWorkoutStatus.SKIPPED })
  @IsOptional()
  @IsEnum(ScheduledWorkoutStatus)
  status?: ScheduledWorkoutStatus;
}

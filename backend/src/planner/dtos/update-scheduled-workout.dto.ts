import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ScheduledWorkoutStatus } from 'src/enums/scheduled-workout-status.enum';

export class UpdateScheduledWorkoutDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(ScheduledWorkoutStatus)
  status?: ScheduledWorkoutStatus;
}

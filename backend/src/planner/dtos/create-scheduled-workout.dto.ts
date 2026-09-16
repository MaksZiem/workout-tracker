import { IsDateString, IsInt } from 'class-validator';

export class CreateScheduledWorkoutDto {
  @IsInt()
  templateId: number;

  @IsDateString()
  date: string;
}

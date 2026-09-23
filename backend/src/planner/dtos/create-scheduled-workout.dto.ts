import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt } from 'class-validator';

export class CreateScheduledWorkoutDto {
  @ApiProperty({ description: 'Identyfikator szablonu treningowego do zaplanowania', example: 1 })
  @IsInt()
  templateId: number;

  @ApiProperty({ description: 'Zaplanowana data treningu (YYYY-MM-DD)', example: '2026-09-25' })
  @IsDateString()
  date: string;
}

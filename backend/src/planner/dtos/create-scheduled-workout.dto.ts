import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateScheduledWorkoutDto {
  @ApiProperty({
    description: 'Identyfikator szablonu treningowego do zaplanowania',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description: 'Zaplanowana data treningu (YYYY-MM-DD)',
    example: '2026-09-25',
  })
  @IsDateString()
  date: string;
}

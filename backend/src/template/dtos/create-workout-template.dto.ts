import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkoutTemplateDto {
  @ApiProperty({
    description: 'Nazwa szablonu treningowego',
    example: 'Push Day A',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Notatki do szablonu',
    example: 'Skupienie na klatce piersiowej i barkach',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Identyfikator planu, do którego ma należeć szablon',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @IsOptional()
  @IsUUID()
  planId?: string;
}

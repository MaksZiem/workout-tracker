import { IsOptional, IsString } from 'class-validator';

export class CreateWorkoutTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

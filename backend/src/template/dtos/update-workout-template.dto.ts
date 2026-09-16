import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkoutTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

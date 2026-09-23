import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateWorkoutTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  planId?: number;
}

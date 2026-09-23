import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class UpdateWorkoutDto {
  @ApiPropertyOptional({ description: 'Notatki dotyczące treningu', example: 'Zmieniona notatka po treningu' })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ description: 'Data odbycia treningu (YYYY-MM-DD)', example: '2026-09-23' })
  @IsOptional()
  @IsDateString()
  date?: string
}

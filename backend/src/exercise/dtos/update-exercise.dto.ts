import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { MuscleGroup } from "src/enums/muscle-group.enum";

export class UpdateExerciseDto {
  @ApiPropertyOptional({ description: 'Nowa nazwa ćwiczenia', example: 'Wyciskanie sztangi leżąc na ławce płaskiej' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name?: string

  @ApiPropertyOptional({ description: 'Nowa grupa mięśniowa', enum: MuscleGroup, example: MuscleGroup.CHEST })
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup
}

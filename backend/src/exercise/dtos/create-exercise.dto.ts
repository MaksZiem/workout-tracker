import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MuscleGroup } from 'src/enums/muscle-group.enum';

export class CreateExerciseDto {
  @ApiProperty({ description: 'Nazwa ćwiczenia (musi być unikalna)', example: 'Wyciskanie sztangi leżąc' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Główna grupa mięśniowa angażowana przez ćwiczenie', enum: MuscleGroup, example: MuscleGroup.CHEST })
  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;
}

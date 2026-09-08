import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { MuscleGroup } from 'src/enums/muscle-group.enum';

export class CreateExerciseDto {
  @IsString()
  name: string;

  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;
}

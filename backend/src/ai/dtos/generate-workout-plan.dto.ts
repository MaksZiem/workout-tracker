import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TrainingGoal } from 'src/enums/training-goal.enum';

export class GenerateWorkoutPlanDto {
  @IsEnum(TrainingGoal)
  goal: TrainingGoal;

  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek: number;

  @IsOptional()
  @IsString()
  constraints?: string;
}

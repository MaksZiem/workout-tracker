import { IsInt, IsString } from "class-validator";

export class ParseWorkoutDto {
  @IsInt()
  workoutId: number;

  @IsString()
  text: string;
}
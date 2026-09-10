import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class AddSetDto {
  @IsInt()
  @Min(1)
  setNumber: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  weight: number;

  @IsInt()
  reps: number;

  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

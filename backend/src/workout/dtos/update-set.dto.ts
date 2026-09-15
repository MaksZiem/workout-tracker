import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  setNumber?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  weight?: number;

  @IsOptional()
  @IsInt()
  reps?: number;

  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

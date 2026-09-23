import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSetDto {
  @ApiPropertyOptional({ description: 'Numer serii w ramach ćwiczenia (od 1)', example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  setNumber?: number;

  @ApiPropertyOptional({ description: 'Użyty ciężar w kilogramach', example: 82.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  weight?: number;

  @ApiPropertyOptional({ description: 'Liczba wykonanych powtórzeń', example: 10 })
  @IsOptional()
  @IsInt()
  reps?: number;

  @ApiPropertyOptional({ description: 'Czas odpoczynku po serii w sekundach', example: 120 })
  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @ApiPropertyOptional({ description: 'Czy seria została ukończona', example: true })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

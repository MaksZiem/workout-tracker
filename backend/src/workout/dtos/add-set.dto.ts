import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class AddSetDto {
  @ApiProperty({ description: 'Numer serii w ramach ćwiczenia (od 1)', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  setNumber: number;

  @ApiProperty({ description: 'Użyty ciężar w kilogramach (maks. 2 miejsca po przecinku)', example: 80 })
  @IsNumber({ maxDecimalPlaces: 2 })
  weight: number;

  @ApiProperty({ description: 'Liczba wykonanych powtórzeń', example: 8 })
  @IsInt()
  reps: number;

  @ApiPropertyOptional({ description: 'Czas odpoczynku po serii w sekundach', example: 90 })
  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @ApiPropertyOptional({ description: 'Czy seria została ukończona', example: true, default: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

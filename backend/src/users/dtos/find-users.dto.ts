import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const USER_SORT_FIELDS = ['name', 'email', 'role', 'workoutCount'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export class FindUsersDto {
  @ApiPropertyOptional({
    description: 'Fraza szukana w imieniu, nazwisku, pełnym imieniu i nazwisku oraz e-mailu (bez względu na wielkość liter)',
    example: 'kowal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Pole sortowania. `name` sortuje po imieniu, potem nazwisku; `role` malejąco stawia administratorów na górze.',
    enum: USER_SORT_FIELDS,
    default: 'name',
  })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sort?: UserSortField;

  @ApiPropertyOptional({ description: 'Kierunek sortowania', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Numer strony (od 1). Strona poza zakresem zwraca ostatnią istniejącą.', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Liczba użytkowników na stronie (1-100)', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

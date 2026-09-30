import { ApiProperty } from '@nestjs/swagger';
import { AdminUserDto } from './admin-user.dto';

export class AdminUsersPageDto {
  @ApiProperty({ description: 'Użytkownicy na tej stronie', type: AdminUserDto, isArray: true })
  items: AdminUserDto[];

  @ApiProperty({ description: 'Liczba wszystkich użytkowników pasujących do wyszukiwania', example: 45 })
  total: number;

  @ApiProperty({ description: 'Zwrócona strona (po przycięciu do zakresu)', example: 1 })
  page: number;

  @ApiProperty({ description: 'Rozmiar strony', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Liczba stron (co najmniej 1)', example: 3 })
  pageCount: number;
}

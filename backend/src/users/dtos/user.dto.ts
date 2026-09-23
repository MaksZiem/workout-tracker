import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole } from 'src/enums/user-role.enum';

export class UserDto {
  @ApiProperty({ description: 'Unikalny identyfikator użytkownika', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Adres e-mail (login)', example: 'jan.kowalski@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Imię użytkownika', example: 'Jan' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Nazwisko użytkownika', example: 'Kowalski' })
  @Expose()
  surname: string;

  @ApiProperty({ description: 'Rola użytkownika', enum: UserRole, example: UserRole.USER })
  @Expose()
  role: UserRole;
}

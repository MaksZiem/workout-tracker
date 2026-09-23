import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Adres e-mail, który będzie loginem użytkownika. Musi być unikalny.',
    example: 'jan.kowalski@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Imię użytkownika', example: 'Jan' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Nazwisko użytkownika', example: 'Kowalski' })
  @IsString()
  surname: string;

  @ApiProperty({
    description: 'Hasło użytkownika (8-24 znaki)',
    example: 'SuperSecret123',
    minLength: 8,
    maxLength: 24,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(24)
  password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    description: 'Adres e-mail użyty przy rejestracji',
    example: 'jan.kowalski@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Hasło użytkownika', example: 'SuperSecret123' })
  @IsString()
  password: string;
}

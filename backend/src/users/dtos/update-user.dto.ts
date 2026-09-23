import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from 'src/enums/user-role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nowy adres e-mail',
    example: 'nowy.email@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description:
      'Nowa rola użytkownika. Może zmienić tylko administrator - zwykły użytkownik dostanie 403 Forbidden przy próbie zmiany tego pola.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Nowe hasło (8-24 znaki)',
    example: 'NoweSuperHaslo456',
    minLength: 8,
    maxLength: 24,
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(24)
  password?: string;
}

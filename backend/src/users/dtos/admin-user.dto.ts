import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserDto } from './user.dto';

export class AdminUserDto extends UserDto {
  @ApiProperty({ description: 'Liczba zapisanych treningów użytkownika', example: 24 })
  @Expose()
  workoutCount: number;
}

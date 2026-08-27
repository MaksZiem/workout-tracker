import { Expose } from 'class-transformer';
import { UserRole } from 'src/enums/user-role.enum';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  surname: string;

  @Expose()
  role: UserRole;
}

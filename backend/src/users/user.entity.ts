import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/enums/user-role.enum';

@Entity()
export class User {
  @ApiProperty({
    description: 'Unikalny identyfikator użytkownika',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    description: 'Adres e-mail (login)',
    example: 'jan.kowalski@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Imię użytkownika', example: 'Jan' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Nazwisko użytkownika', example: 'Kowalski' })
  @Column()
  surname: string;

  @ApiProperty({
    description: 'Rola użytkownika w systemie',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;
}

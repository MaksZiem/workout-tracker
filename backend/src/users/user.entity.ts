import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/enums/user-role.enum';

@Entity()
export class User {
  @ApiProperty({ description: 'Unikalny identyfikator użytkownika', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ description: 'Adres e-mail (login)', example: 'jan.kowalski@example.com' })
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
  @Column({type: 'enum', enum: UserRole, default: UserRole.USER})
  role: UserRole
}

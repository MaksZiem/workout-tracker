import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from 'src/helpers/hash-password';
import { promisify } from 'util';
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, password: string, name: string, surname: string) {
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException('User already exists');
    }

    const result = hashPassword(password);

    const user = await this.usersService.create(email, password, name, surname);

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      surname: user.surname,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new UnauthorizedException('Bad credentials');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

     if (
      storedHashBuffer.length !== hash.length ||
      !timingSafeEqual(storedHashBuffer, hash)
    ) {
      throw new UnauthorizedException('common.auth.invalid_credentials');
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name, surname: user.surname };

    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}

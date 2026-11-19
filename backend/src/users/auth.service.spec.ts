import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { hashPassword } from 'src/helpers/hash-password';

jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));

describe('AuthService', () => {
  let usersService: { find: jest.Mock; create: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    usersService = { find: jest.fn(), create: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
    service = new AuthService(usersService as any, jwtService as any);
  });

  describe('signup', () => {
    it('rejects an email that is already in use', async () => {
      usersService.find.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.signup('jan@example.com', 'secret123', 'Jan', 'Kowalski'),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('stores a hashed password, never the plain one', async () => {
      usersService.find.mockResolvedValue([]);
      usersService.create.mockResolvedValue({ id: 1 });

      await service.signup('jan@example.com', 'secret123', 'Jan', 'Kowalski');

      const storedPassword: string = usersService.create.mock.calls[0][1];
      expect(storedPassword).not.toContain('secret123');
      expect(storedPassword).toMatch(/^[0-9a-f]{16}\.[0-9a-f]{64}$/);
    });

    it('returns an access token', async () => {
      usersService.find.mockResolvedValue([]);
      usersService.create.mockResolvedValue({ id: 1, email: 'jan@example.com' });

      const result = await service.signup(
        'jan@example.com',
        'secret123',
        'Jan',
        'Kowalski',
      );

      expect(result).toEqual({ access_token: 'jwt-token' });
    });
  });

  describe('signin', () => {
    it('rejects an unknown email', async () => {
      usersService.find.mockResolvedValue([]);

      await expect(
        service.signin('nobody@example.com', 'secret123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      usersService.find.mockResolvedValue([
        { id: 1, password: await hashPassword('secret123') },
      ]);

      await expect(
        service.signin('jan@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('returns a token for the correct password', async () => {
      usersService.find.mockResolvedValue([
        {
          id: 1,
          email: 'jan@example.com',
          password: await hashPassword('secret123'),
        },
      ]);

      const result = await service.signin('jan@example.com', 'secret123');

      expect(result).toEqual({ access_token: 'jwt-token' });
    });
  });
});

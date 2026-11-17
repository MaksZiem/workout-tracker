import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { errorBody } from 'src/common/error-body';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { UserRole } from 'src/enums/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(errorBody(HttpStatus.UNAUTHORIZED, 'MISSING_TOKEN', 'Missing authorization token'));
    }

    let payload: { id: number };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException(errorBody(HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN', 'Token is wrong'));
    }

    const user = await this.usersService.findOne(payload.id);
    if (!user) {
      throw new UnauthorizedException(errorBody(HttpStatus.UNAUTHORIZED, 'USER_NOT_FOUND', 'User not found'));
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(errorBody(HttpStatus.FORBIDDEN, 'ADMIN_REQUIRED', 'Admin role required'));
    }

    request['currentUser'] = user;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}

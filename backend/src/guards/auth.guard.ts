import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean>{
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)

    if(!token) {
      throw new UnauthorizedException('Token is wrong')
    }

    let payload: {id: number}

    try {
      payload = await this.jwtService.verifyAsync(token)
    } catch (error) {
      throw new UnauthorizedException('Token is wrong')
    }

    const user = await this.usersService.findOne(payload.id)
    if(!user) {
      throw new UnauthorizedException('User not found')
    }

    request['currentUser'] = user
    return true
  }

    private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}

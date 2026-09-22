import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ADMIN_COOKIE, readCookie } from '../common/cookies';

export const ADMIN_ROLE = 'admin';

function bearerToken(req: Request) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  return type?.toLowerCase() === 'bearer' && token ? token : '';
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const token = readCookie(req, ADMIN_COOKIE) || bearerToken(req);
    if (!token) throw new UnauthorizedException('Non autorisé.');
    try {
      const payload = await this.jwt.verifyAsync<{ role?: string }>(token);
      if (payload.role !== ADMIN_ROLE) {
        throw new UnauthorizedException('Non autorisé.');
      }
      return true;
    } catch {
      throw new UnauthorizedException('Non autorisé.');
    }
  }
}

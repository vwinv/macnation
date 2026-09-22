import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CLIENT_COOKIE, readCookie } from '../common/cookies';
import { StoreService } from '../store/store.service';
import type { Client } from '../store/store.types';

/**
 * The property is not called `client` because Node exposes `req.client` as a
 * deprecated alias of the TCP socket, which would look like a logged-in session.
 */
export type AuthedRequest = Request & { authClient?: Client };

function bearerToken(req: Request) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  return type?.toLowerCase() === 'bearer' && token ? token : '';
}

/** Mobile app sends a Bearer token, the website relies on the mn_client cookie. */
export function clientToken(req: Request) {
  return bearerToken(req) || readCookie(req, CLIENT_COOKIE);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly store: StoreService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = clientToken(req);
    if (!token) {
      throw new UnauthorizedException('Connecte-toi pour continuer.');
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      const client = await this.store.findClient(payload.sub);
      if (!client) {
        throw new UnauthorizedException('Session expirée. Reconnecte-toi.');
      }
      req.authClient = client;
      return true;
    } catch {
      throw new UnauthorizedException('Session expirée. Reconnecte-toi.');
    }
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly store: StoreService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = clientToken(req);
    if (!token) return true;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      req.authClient = await this.store.findClient(payload.sub);
    } catch {
      req.authClient = undefined;
    }
    return true;
  }
}

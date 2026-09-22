import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import { ADMIN_ROLE } from '../auth/admin.guard';

@Injectable()
export class AdminService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  passwordOk(password: string) {
    const expected = (this.config.get<string>('ADMIN_PASSWORD') || '').trim();
    if (!expected || password.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  }

  token() {
    return this.jwt.sign({ role: ADMIN_ROLE });
  }
}

import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { clearAdminCookie, setAdminCookie } from '../common/cookies';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly admin: AdminService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const password = (body as { password?: unknown } | null)?.password;
    if (typeof password !== 'string' || !this.admin.passwordOk(password)) {
      throw new UnauthorizedException('Mot de passe incorrect.');
    }
    setAdminCookie(res, this.admin.token());
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    clearAdminCookie(res);
    return { ok: true };
  }
}

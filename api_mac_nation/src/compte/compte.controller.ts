import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Patch,
  Post,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { CurrentClient } from '../auth/current-client.decorator';
import { ClientsService } from '../clients/clients.service';
import { clearClientCookie, setClientCookie } from '../common/cookies';
import { isSnMobile, normalizePhone } from '../common/phone';
import { hashPassword, isPassword, passwordOk } from '../common/password';
import { OauthError, OauthService } from '../oauth/oauth.service';
import { StoreService } from '../store/store.service';
import type { Client, OauthProvider } from '../store/store.types';

const PROVIDERS: OauthProvider[] = ['google', 'apple', 'facebook'];

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Cookie-based twin of the mobile /auth and /me routes: same services, but the
 * session travels in the mn_client cookie so the website can proxy /api/compte/*.
 */
@Controller('compte')
export class CompteController {
  private readonly logger = new Logger(CompteController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly clients: ClientsService,
    private readonly oauth: OauthService,
    private readonly store: StoreService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = (body || {}) as { phone?: unknown; password?: unknown };
    const phone = text(payload.phone);
    const password = text(payload.password);
    if (!isSnMobile(phone) || !password) {
      throw new BadRequestException('Téléphone ou mot de passe incorrect.');
    }
    const client = await this.store.findClientByPhone(phone);
    if (!client || !client.passwordHash || !passwordOk(password, client.passwordHash)) {
      throw new UnauthorizedException('Téléphone ou mot de passe incorrect.');
    }
    return this.issueSession(res, client);
  }

  @Post('register')
  @HttpCode(200)
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = (body || {}) as {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
      password?: unknown;
    };
    const name = text(payload.name);
    const phone = text(payload.phone);
    const email = text(payload.email);
    const password = text(payload.password);

    if (!name || !phone) {
      throw new BadRequestException('Indique ton nom et ton téléphone.');
    }
    if (!isSnMobile(phone)) {
      throw new BadRequestException(
        'Indique un numéro sénégalais valide (77, 78, 76, 70…).',
      );
    }
    if (!isPassword(password)) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins 8 caractères.',
      );
    }

    const client = await this.store.createClient({
      name,
      phone: normalizePhone(phone),
      email,
      passwordHash: hashPassword(password),
    });
    return this.issueSession(res, client);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    clearClientCookie(res);
    return { ok: true };
  }

  @Get('session')
  @UseGuards(OptionalAuthGuard)
  session(@CurrentClient() client?: Client) {
    if (!client) return { name: '' };
    const publicClient = this.store.publicClient(client);
    return {
      name: publicClient.name,
      phone: publicClient.phone,
      email: publicClient.email,
      id: publicClient.id,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentClient() client: Client) {
    return this.clients.dashboard(client);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  async profile(@CurrentClient() client: Client, @Body() body: unknown) {
    const payload = (body || {}) as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      phone?: unknown;
    };
    const password = text(payload.password);
    if (!client.passwordHash && !password) {
      throw new BadRequestException(
        'Choisis un mot de passe d’au moins 8 caractères pour te reconnecter.',
      );
    }
    const updated = await this.clients.update(client, {
      name: text(payload.name),
      email: text(payload.email),
      password: password || undefined,
      phone: text(payload.phone),
    });
    return { ok: true, client: updated };
  }

  @Post('redeem')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async redeem(@CurrentClient() client: Client) {
    const updated = await this.clients.redeem(client);
    return { ok: true, client: updated };
  }

  @Delete('membership')
  @UseGuards(AuthGuard)
  async cancelMembership(@CurrentClient() client: Client) {
    const membership = await this.clients.cancelMembership(client);
    return { ok: true, membership };
  }

  @Get('oauth/config')
  oauthConfig() {
    return this.oauth.publicConfig();
  }

  @Post('oauth')
  @HttpCode(200)
  async oauthLogin(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = (body || {}) as {
      provider?: unknown;
      credential?: unknown;
      nonce?: unknown;
      name?: unknown;
    };
    const provider = text(payload.provider);
    const credential = text(payload.credential);
    const nonce = text(payload.nonce);
    const name = text(payload.name);

    if (!credential || !PROVIDERS.includes(provider as OauthProvider)) {
      throw new BadRequestException('Connexion invalide.');
    }

    try {
      const profile = await this.oauth.verify({
        provider,
        credential,
        nonce,
        name,
      });
      const client = await this.store.loginOrRegisterOAuth(profile);
      setClientCookie(res, this.auth.tokenFor(client.id));
      await this.store.activateClientSession(client);
      return { ok: true, client };
    } catch (error) {
      if (error instanceof OauthError) {
        if (error.code === 'OAUTH_MISSING') {
          throw new ServiceUnavailableException(
            'Cette connexion n’est pas encore activée.',
          );
        }
        throw new UnauthorizedException('Connexion refusée. Réessaie.');
      }
      this.logger.error(`Connexion sociale échouée: ${String(error)}`);
      throw new UnauthorizedException('Connexion refusée. Réessaie.');
    }
  }

  private async issueSession(res: Response, client: Client) {
    await this.store.activateClientSession(client);
    setClientCookie(res, this.auth.tokenFor(client.id));
    return { ok: true, client: this.store.publicClient(client) };
  }
}

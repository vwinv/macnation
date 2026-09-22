import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OauthError, OauthService } from '../oauth/oauth.service';
import { StoreService } from '../store/store.service';
import type { Client, OauthProvider } from '../store/store.types';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentClient } from './current-client.decorator';

const PROVIDERS: OauthProvider[] = ['google', 'apple', 'facebook'];

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly store: StoreService,
    private readonly oauth: OauthService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentClient() client: Client) {
    return { ok: true, client: this.store.publicClient(client) };
  }

  @Get('oauth/config')
  oauthConfig() {
    return this.oauth.publicConfig();
  }

  @Post('oauth')
  @HttpCode(200)
  async oauthLogin(@Body() body: unknown) {
    const payload = (body || {}) as {
      provider?: unknown;
      credential?: unknown;
      nonce?: unknown;
      name?: unknown;
    };
    const provider = text(payload.provider);
    const credential = text(payload.credential);
    if (!credential || !PROVIDERS.includes(provider as OauthProvider)) {
      throw new BadRequestException('Connexion invalide.');
    }
    try {
      const profile = await this.oauth.verify({
        provider,
        credential,
        nonce: text(payload.nonce),
        name: text(payload.name),
      });
      const client = await this.store.loginOrRegisterOAuth(profile);
      await this.store.activateClientSession(client);
      return {
        ok: true as const,
        token: this.auth.tokenFor(client.id),
        client,
      };
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
}

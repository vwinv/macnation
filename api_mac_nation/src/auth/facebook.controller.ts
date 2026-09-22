import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { siteUrl } from '../common/site';
import { ConfigService } from '@nestjs/config';
import { OauthError, OauthService } from '../oauth/oauth.service';
import { StoreService } from '../store/store.service';
import { AuthService } from './auth.service';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Facebook Login for the mobile app and the website, plus Meta’s data-deletion
 * callback (required to publish a Facebook app).
 */
@Controller('auth/facebook')
export class FacebookAuthController {
  private readonly logger = new Logger(FacebookAuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly oauth: OauthService,
    private readonly store: StoreService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  async login(@Body() body: unknown) {
    const payload = (body || {}) as {
      credential?: unknown;
      accessToken?: unknown;
      idToken?: unknown;
      name?: unknown;
    };
    const credential =
      text(payload.credential) ||
      text(payload.idToken) ||
      text(payload.accessToken);
    if (!credential) {
      throw new BadRequestException(
        'Jeton Facebook manquant (credential, idToken ou accessToken).',
      );
    }
    try {
      const profile = await this.oauth.verify({
        provider: 'facebook',
        credential,
        name: text(payload.name),
      });
      const client = await this.store.loginOrRegisterOAuth(profile);
      return {
        ok: true as const,
        token: this.auth.tokenFor(client.id),
        client,
      };
    } catch (error) {
      this.throwOauth(error);
    }
  }

  /**
   * URL to set in Meta Developers → Data deletion request URL:
   * `{SITE_URL}/api/auth/facebook/data-deletion`
   */
  @Post('data-deletion')
  @HttpCode(200)
  async dataDeletion(
    @Body() body: unknown,
    @Query('signed_request') signedQuery?: string,
  ) {
    const payload = (body || {}) as { signed_request?: unknown };
    const signed = text(payload.signed_request) || text(signedQuery);
    if (!signed) {
      throw new BadRequestException('signed_request manquant.');
    }
    try {
      const facebookUserId = this.oauth.parseDataDeletion(signed);
      await this.store.forgetFacebookUser(facebookUserId);
      const confirmationCode = this.oauth.confirmationCode(facebookUserId);
      const origin = siteUrl(this.config);
      return {
        url: `${origin}/suppression-donnees?code=${encodeURIComponent(confirmationCode)}`,
        confirmation_code: confirmationCode,
      };
    } catch (error) {
      this.throwOauth(error);
    }
  }

  @Get('deletion/:code')
  deletionStatus(@Param('code') code: string) {
    if (!code?.trim()) {
      throw new BadRequestException('Code manquant.');
    }
    return {
      confirmation_code: code.trim(),
      status: 'completed' as const,
    };
  }

  private throwOauth(error: unknown): never {
    if (error instanceof OauthError) {
      if (error.code === 'OAUTH_MISSING') {
        throw new ServiceUnavailableException(
          'Connexion Facebook pas encore activée.',
        );
      }
      throw new UnauthorizedException('Connexion Facebook refusée.');
    }
    this.logger.error(`Facebook: ${String(error)}`);
    throw new UnauthorizedException('Connexion Facebook refusée.');
  }
}

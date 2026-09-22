import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { siteUrl } from '../common/site';
import type { OauthProvider } from '../store/store.types';
import { isJwtCredential, parseFacebookSignedRequest } from './facebook.util';

export type OauthErrorCode =
  | 'OAUTH_MISSING'
  | 'OAUTH_PROVIDER'
  | 'OAUTH_NONCE'
  | 'OAUTH_INVALID'
  | 'OAUTH_EMAIL';

export class OauthError extends Error {
  constructor(readonly code: OauthErrorCode) {
    super(code);
    this.name = 'OauthError';
  }
}

export type VerifiedOauth = {
  provider: OauthProvider;
  providerId: string;
  email: string;
  name: string;
};

const googleJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);
const appleJwks = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);
const facebookLimitedJwks = createRemoteJWKSet(
  new URL('https://limited.facebook.com/.well-known/oauth/openid/jwks/'),
);

const FACEBOOK_GRAPH = 'https://graph.facebook.com/v21.0';
const FETCH_MS = 8_000;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(private readonly config: ConfigService) {}

  private env(...keys: string[]) {
    for (const key of keys) {
      const value = (this.config.get<string>(key) || '').trim();
      if (value) return value;
    }
    return '';
  }

  publicConfig() {
    return {
      google: this.env('GOOGLE_CLIENT_ID', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'),
      apple: this.env('APPLE_CLIENT_ID', 'NEXT_PUBLIC_APPLE_CLIENT_ID'),
      facebook: this.env('FACEBOOK_APP_ID', 'NEXT_PUBLIC_FACEBOOK_APP_ID'),
      siteUrl: siteUrl(this.config),
    };
  }

  facebookConfigured() {
    return Boolean(this.publicConfig().facebook && this.env('FACEBOOK_APP_SECRET'));
  }

  confirmationCode(facebookUserId: string) {
    return createHash('sha256')
      .update(`mac-nation-facebook:${facebookUserId}`)
      .digest('hex')
      .slice(0, 24);
  }

  parseDataDeletion(signedRequest: string) {
    const secret = this.env('FACEBOOK_APP_SECRET');
    if (!secret) throw new OauthError('OAUTH_MISSING');
    const payload = parseFacebookSignedRequest(signedRequest, secret);
    const userId = text(payload?.user_id);
    if (!userId) throw new OauthError('OAUTH_INVALID');
    return userId;
  }

  async verify(input: {
    provider: string;
    credential: string;
    nonce?: string;
    name?: string;
  }): Promise<VerifiedOauth> {
    if (input.provider === 'google') {
      return this.verifyGoogle(input.credential, input.nonce);
    }
    if (input.provider === 'apple') {
      const verified = await this.verifyApple(input.credential, input.nonce);
      if (input.name?.trim()) verified.name = input.name.trim();
      return verified;
    }
    if (input.provider === 'facebook') {
      return this.verifyFacebook(input.credential);
    }
    throw new OauthError('OAUTH_PROVIDER');
  }

  private async verifyGoogle(
    credential: string,
    nonce?: string,
  ): Promise<VerifiedOauth> {
    const clientId = this.publicConfig().google;
    if (!clientId) throw new OauthError('OAUTH_MISSING');
    const { payload } = await jwtVerify(credential, googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
    if (nonce && payload.nonce && payload.nonce !== nonce) {
      throw new OauthError('OAUTH_NONCE');
    }
    const email = text(payload.email);
    if (payload.email_verified !== true || !email) {
      throw new OauthError('OAUTH_EMAIL');
    }
    return {
      provider: 'google',
      providerId: String(payload.sub),
      email,
      name: text(payload.name) || email.split('@')[0],
    };
  }

  private async verifyApple(
    credential: string,
    nonce?: string,
  ): Promise<VerifiedOauth> {
    const clientId = this.publicConfig().apple;
    if (!clientId) throw new OauthError('OAUTH_MISSING');
    const { payload } = await jwtVerify(credential, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: clientId,
    });
    if (nonce) {
      const expected = sha256(nonce);
      const received = text(payload.nonce);
      if (received && received !== expected && received !== nonce) {
        throw new OauthError('OAUTH_NONCE');
      }
    }
    const email = text(payload.email);
    return {
      provider: 'apple',
      providerId: String(payload.sub),
      email,
      name: email ? email.split('@')[0] : 'Client MAC NATION',
    };
  }

  private async verifyFacebook(credential: string): Promise<VerifiedOauth> {
    if (!this.facebookConfigured()) throw new OauthError('OAUTH_MISSING');
    if (isJwtCredential(credential)) {
      return this.verifyFacebookIdToken(credential);
    }
    return this.verifyFacebookAccessToken(credential);
  }

  /** Facebook Limited Login (iOS / Android) sends an OIDC JWT, not a Graph token. */
  private async verifyFacebookIdToken(credential: string): Promise<VerifiedOauth> {
    const appId = this.publicConfig().facebook;
    try {
      const result = await jwtVerify(credential, facebookLimitedJwks, {
        issuer: ['https://www.facebook.com', 'https://facebook.com'],
        audience: appId,
      });
      const payload = result.payload as Record<string, unknown>;
      const userId = text(payload.sub);
      if (!userId) throw new OauthError('OAUTH_INVALID');
      const email = text(payload.email);
      const name =
        text(payload.name) ||
        [text(payload.given_name), text(payload.family_name)]
          .filter(Boolean)
          .join(' ');
      return {
        provider: 'facebook',
        providerId: userId,
        email,
        name: name || (email ? email.split('@')[0] : 'Client MAC NATION'),
      };
    } catch (error) {
      if (error instanceof OauthError) throw error;
      this.logger.warn(`Jeton Facebook Limited Login refusé: ${String(error)}`);
      throw new OauthError('OAUTH_INVALID');
    }
  }

  /** Classic Facebook Login (site JS SDK) sends a user access token. */
  private async verifyFacebookAccessToken(
    accessToken: string,
  ): Promise<VerifiedOauth> {
    const appId = this.publicConfig().facebook;
    const secret = this.env('FACEBOOK_APP_SECRET');
    const debugUrl = new URL(`${FACEBOOK_GRAPH}/debug_token`);
    debugUrl.searchParams.set('input_token', accessToken);
    debugUrl.searchParams.set('access_token', `${appId}|${secret}`);

    const debug = await this.facebookJson<{
      data?: {
        app_id?: string;
        is_valid?: boolean;
        user_id?: string;
        expires_at?: number;
      };
      error?: { message?: string };
    }>(debugUrl);
    const data = debug?.data;
    if (
      !data?.is_valid ||
      data.app_id !== appId ||
      (typeof data.expires_at === 'number' &&
        data.expires_at > 0 &&
        data.expires_at * 1000 < Date.now())
    ) {
      this.logger.warn(
        `Token Facebook rejeté: ${debug?.error?.message || 'invalide'}`,
      );
      throw new OauthError('OAUTH_INVALID');
    }

    const meUrl = new URL(`${FACEBOOK_GRAPH}/me`);
    meUrl.searchParams.set('fields', 'id,name,email');
    meUrl.searchParams.set('access_token', accessToken);
    const me = await this.facebookJson<{
      id?: string;
      name?: string;
      email?: string;
    }>(meUrl);
    if (!me?.id) throw new OauthError('OAUTH_INVALID');
    return {
      provider: 'facebook',
      providerId: me.id,
      email: text(me.email),
      name: text(me.name) || 'Client MAC NATION',
    };
  }

  private async facebookJson<T>(url: URL): Promise<T | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_MS) });
      return (await res.json().catch(() => null)) as T | null;
    } catch (error) {
      this.logger.warn(`Graph Facebook injoignable: ${String(error)}`);
      throw new OauthError('OAUTH_INVALID');
    }
  }
}

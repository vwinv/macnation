import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isSnMobile, normalizePhone } from '../common/phone';
import { hashPassword, isPassword, passwordOk } from '../common/password';
import { StoreService } from '../store/store.service';
import type { Client } from '../store/store.types';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly store: StoreService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const name = dto.name.trim();
    const phone = normalizePhone(dto.phone);
    const email = (dto.email || '').trim();
    if (!name || !phone) {
      throw new UnprocessableEntityException(
        'Indique ton nom et ton téléphone.',
      );
    }
    if (!isSnMobile(phone)) {
      throw new UnprocessableEntityException(
        'Indique un numéro sénégalais valide (77, 78, 76, 70…).',
      );
    }
    if (!isPassword(dto.password)) {
      throw new UnprocessableEntityException(
        'Le mot de passe doit contenir au moins 8 caractères.',
      );
    }
    const client = await this.store.createClient({
      name,
      phone,
      email,
      passwordHash: hashPassword(dto.password),
    });
    return this.session(client);
  }

  async login(dto: LoginDto) {
    const phone = normalizePhone(dto.phone);
    if (!isSnMobile(phone)) {
      throw new UnprocessableEntityException(
        'Indique un numéro sénégalais valide (77, 78, 76, 70…).',
      );
    }
    const client = await this.store.findClientByPhone(phone);
    if (!client || !passwordOk(dto.password, client.passwordHash)) {
      throw new UnauthorizedException('Numéro ou mot de passe incorrect.');
    }
    return this.session(client);
  }

  async session(client: Client) {
    await this.store.activateClientSession(client);
    return {
      ok: true as const,
      token: this.tokenFor(client.id),
      client: this.store.publicClient(client),
    };
  }

  tokenFor(clientId: string) {
    return this.jwt.sign({ sub: clientId });
  }
}

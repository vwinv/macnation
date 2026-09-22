import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { REDEEM_FCFA, REDEEM_POINTS } from '../common/loyalty';
import { isSnMobile, normalizePhone } from '../common/phone';
import { hashPassword, isPassword } from '../common/password';
import { StoreService } from '../store/store.service';
import type { Client } from '../store/store.types';
import { UpdateProfileDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly store: StoreService) {}

  async dashboard(client: Client) {
    const data = await this.store.dashboard(client);
    return {
      ...data,
      redeemPoints: REDEEM_POINTS,
      redeemFcfa: REDEEM_FCFA,
    };
  }

  async update(client: Client, dto: UpdateProfileDto) {
    const name =
      dto.name !== undefined ? dto.name.trim() : client.name.trim();
    if (!name) {
      throw new UnprocessableEntityException('Indique ton nom.');
    }

    let phone: string | undefined;
    if (dto.phone !== undefined) {
      phone = dto.phone.trim() ? normalizePhone(dto.phone) : '';
      if (phone && !isSnMobile(phone)) {
        throw new UnprocessableEntityException(
          'Indique un numéro sénégalais valide (77, 78, 76, 70…).',
        );
      }
    }

    const currentPhone = this.store.publicClient(client).phone;
    const nextPhone = phone !== undefined ? phone : currentPhone;
    if (!nextPhone) {
      throw new UnprocessableEntityException(
        'Ajoute un numéro sénégalais (77, 78, 76, 70…) pour réserver et payer.',
      );
    }

    if (dto.password && !isPassword(dto.password)) {
      throw new UnprocessableEntityException(
        'Le mot de passe doit contenir au moins 8 caractères.',
      );
    }

    return this.store.updateClient(client.id, {
      name,
      email: dto.email !== undefined ? dto.email.trim() : undefined,
      passwordHash: dto.password ? hashPassword(dto.password) : undefined,
      phone,
    });
  }

  redeem(client: Client) {
    return this.store.redeem(client.id, REDEEM_POINTS, REDEEM_FCFA);
  }

  cancelMembership(client: Client) {
    return this.store.cancelMembership(client.id);
  }
}

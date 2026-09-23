import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { formatFcfa, parsePaymentMethod } from '../common/money';
import { isSnMobile, normalizePhone } from '../common/phone';
import { NotifyService } from '../notify/notify.service';
import { StoreService } from '../store/store.service';
import type { Client } from '../store/store.types';
import { CheckoutDto } from './checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly store: StoreService,
    private readonly notify: NotifyService,
    private readonly catalog: CatalogService,
  ) {}

  async create(dto: CheckoutDto, client?: Client) {
    const name = (dto.name || client?.name || '').trim();
    const phone = normalizePhone(dto.phone || client?.phone || '');
    const email = (dto.email || client?.email || '').trim();
    const qty = Math.min(10, Math.max(1, Math.trunc(Number(dto.qty)) || 1));
    const method = parsePaymentMethod(dto.paymentMethod);

    if (!name || !phone) {
      throw new UnprocessableEntityException(
        'Indiquez votre nom et votre téléphone.',
      );
    }
    if (!isSnMobile(phone)) {
      throw new UnprocessableEntityException(
        'Indiquez un numéro sénégalais valide (77, 78, 76, 70…).',
      );
    }

    let invoiceKind: 'boutique' | 'abonnement' = 'boutique';
    let note = '';
    let planId: string | undefined;
    let items: { name: string; qty: number; unitPrice: number }[] = [];

    if (dto.kind === 'boutique') {
      const lines = dto.items?.length
        ? dto.items
        : dto.itemId
          ? [{ itemId: dto.itemId, qty }]
          : [];
      if (!lines.length) {
        throw new UnprocessableEntityException('Votre panier est vide.');
      }
      const merged = new Map<string, number>();
      for (const line of lines) {
        const id = String(line.itemId || '').trim();
        if (!id) continue;
        const next = Math.min(10, (merged.get(id) || 0) + Math.min(10, Math.max(1, Math.trunc(Number(line.qty)) || 1)));
        merged.set(id, next);
      }
      for (const [id, lineQty] of merged) {
        const product = await this.catalog.product(id);
        if (!product) throw new NotFoundException('Produit introuvable.');
        if (product.price <= 0) {
          throw new UnprocessableEntityException('Montant à confirmer au salon.');
        }
        items.push({ name: product.name, qty: lineQty, unitPrice: product.price });
      }
      if (!items.length) {
        throw new UnprocessableEntityException('Votre panier est vide.');
      }
      note = 'Boutique · retrait au salon Nord Foire';
    } else if (dto.kind === 'abonnement') {
      if (!dto.itemId) throw new NotFoundException('Abonnement introuvable.');
      const plan = await this.catalog.plan(dto.itemId);
      if (!plan) throw new NotFoundException('Abonnement introuvable.');
      items = [
        {
          name: `Abonnement ${plan.name} · ${plan.period}`,
          qty: 1,
          unitPrice: plan.price,
        },
      ];
      invoiceKind = 'abonnement';
      note = `Abonnement ${plan.name} · 1 mois`;
      planId = plan.id;
    }

    if (!items.length || items.some((item) => item.unitPrice <= 0)) {
      throw new UnprocessableEntityException('Montant à confirmer au salon.');
    }

    const amount = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const label = items
      .map((item) => `${item.name}${item.qty > 1 ? ` × ${item.qty}` : ''}`)
      .join(', ');
    const online = method === 'wave' || method === 'orange' || method === 'free';
    const loggedIn = Boolean(client);
    if (!loggedIn && !email) {
      const existing = await this.store.findClientByPhone(phone);
      if (!existing) {
        throw new UnprocessableEntityException(
          'Indiquez votre email pour recevoir vos accès.',
        );
      }
    }
    const ensured = await this.store.ensurePublicClient({
      clientId: client?.id,
      name,
      phone,
      email,
    });
    if (ensured.generatedPassword) {
      await this.notify.accountCreated({
        name,
        phone,
        email,
        password: ensured.generatedPassword,
      });
    }
    const clientId = ensured.id || client?.id;
    const accountCreated = Boolean(ensured.generatedPassword);

    if (online) {
      const pending = await this.store.createPendingPayment({
        amount,
        phone,
        payload: {
          kind: invoiceKind,
          clientName: name,
          clientPhone: phone,
          clientEmail: email,
          items,
          note,
          label,
          clientId,
          planId,
        },
      });
      return {
        ok: true as const,
        invoiceId: '',
        pendingId: pending.id,
        amount,
        kind: invoiceKind,
        paymentMethod: method,
        membership: null,
        accountCreated,
        loginRequired: !loggedIn,
      };
    }

    const created = await this.store.createCheckout({
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      items,
      note,
      kind: invoiceKind,
      clientId,
      planId,
      paymentMethod: method,
    });

    await this.notify.checkoutCreated({
      name,
      phone,
      email,
      label,
      amountLabel: formatFcfa(created.invoice.amount),
      note,
      kind: invoiceKind,
    });

    return {
      ok: true as const,
      invoiceId: created.invoice.id,
      amount: created.invoice.amount,
      kind: invoiceKind,
      paymentMethod: method,
      membership: created.membership,
      accountCreated,
      loginRequired: !loggedIn,
    };
  }
}

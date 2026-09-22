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

    let lineName = '';
    let unitPrice = 0;
    let invoiceKind: 'boutique' | 'abonnement' = 'boutique';
    let note = '';
    let planId: string | undefined;
    const resolvedId = dto.itemId;

    if (dto.kind === 'boutique') {
      const product = await this.catalog.product(resolvedId);
      if (!product) throw new NotFoundException('Produit introuvable.');
      lineName = product.name;
      unitPrice = product.price;
      note = 'Boutique · retrait au salon Nord Foire';
    } else if (dto.kind === 'abonnement') {
      const plan = await this.catalog.plan(resolvedId);
      if (!plan) throw new NotFoundException('Abonnement introuvable.');
      lineName = `Abonnement ${plan.name} · ${plan.period}`;
      unitPrice = plan.price;
      invoiceKind = 'abonnement';
      note = `Abonnement ${plan.name} · 1 mois`;
      planId = plan.id;
    }

    if (unitPrice <= 0) {
      throw new UnprocessableEntityException('Montant à confirmer au salon.');
    }

    const quantity = invoiceKind === 'abonnement' ? 1 : qty;
    const items = [
      {
        name: lineName,
        qty: quantity,
        unitPrice,
      },
    ];
    const amount = items[0].qty * items[0].unitPrice;
    const label = `${lineName}${quantity > 1 ? ` × ${quantity}` : ''}`;
    const online = method === 'wave' || method === 'orange' || method === 'free';
    const loggedIn = Boolean(client);
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
